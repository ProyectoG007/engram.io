// ============================================
// CAPA 3 + CAPA 9: RAG PIPELINE
// Retrieval-Augmented Generation Service
// ============================================

import { TogetherProvider, DEFAULT_MODELS } from "@/lib/ai-providers";
import { getPineconeIndex, cacheGet, cacheSet } from "@/lib/db";
import type { RagQueryInput, RagResponse } from "@/types";

// --------------------------------------------
// CONFIGURACIÓN
// --------------------------------------------
const EMBEDDING_MODEL = DEFAULT_MODELS.together.embedding;
const LLM_MODEL = DEFAULT_MODELS.together.chat;
const TOP_K_DEFAULT = 5;
const SIMILARITY_THRESHOLD = 0.7;

// --------------------------------------------
// EMBEDDING SERVICE
// --------------------------------------------
export class EmbeddingService {
  private provider: TogetherProvider;
  
  constructor(apiKey: string) {
    this.provider = new TogetherProvider(apiKey);
  }
  
  async embedDocuments(texts: string[]): Promise<number[][]> {
    // Formatear con "passage:" para documentos
    const formattedTexts = texts.map(t => `passage: ${t}`);
    
    const embeddings = await this.provider.embeddings(formattedTexts);
    
    // Normalización L2
    return embeddings.map((emb: number[]) => {
      const norm = Math.sqrt(emb.reduce((sum: number, val: number) => sum + val * val, 0));
      return emb.map((val: number) => val / norm);
    });
  }
  
  async embedQuery(text: string): Promise<number[]> {
    // Formatear con "query:" para consultas
    const formattedText = `query: ${text}`;
    
    const embeddings = await this.provider.embeddings([formattedText]);
    
    // Normalización L2
    const emb = embeddings[0];
    const norm = Math.sqrt(emb.reduce((sum: number, val: number) => sum + val * val, 0));
    return emb.map((val: number) => val / norm);
  }
}

// --------------------------------------------
// TEXT CHUNKER
// --------------------------------------------
export class TextChunker {
  constructor(
    private chunkSize: number = 512,
    private chunkOverlap: number = 50,
    private separators: string[] = ["\n\n", "\n", ". ", " ", ""]
  ) {}
  
  splitText(text: string): string[] {
    return this.recursiveSplit(text, this.separators);
  }
  
  private recursiveSplit(text: string, separators: string[]): string[] {
    // Estimación simple: caracteres / 4 ≈ tokens
    if (text.length / 4 <= this.chunkSize) {
      return text.trim() ? [text] : [];
    }
    
    if (!separators.length) {
      return this.splitBySize(text);
    }
    
    const separator = separators[0];
    const nextSeparators = separators.slice(1);
    
    const parts = separator ? text.split(separator) : text.split("");
    const chunks: string[] = [];
    let currentChunk = "";
    
    for (const part of parts) {
      const candidate = currentChunk + (currentChunk && separator ? separator : "") + part;
      
      if (candidate.length / 4 <= this.chunkSize) {
        currentChunk = candidate;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = part;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return this.applyOverlap(chunks);
  }
  
  private splitBySize(text: string): string[] {
    const chunks: string[] = [];
    const charsPerChunk = this.chunkSize * 4;
    const overlapChars = this.chunkOverlap * 4;
    
    for (let start = 0; start < text.length; start += charsPerChunk - overlapChars) {
      const chunk = text.slice(start, start + charsPerChunk);
      if (chunk.trim()) chunks.push(chunk);
    }
    
    return chunks;
  }
  
  private applyOverlap(chunks: string[]): string[] {
    if (!chunks.length || this.chunkOverlap === 0) return chunks;
    
    const result = [chunks[0]];
    const overlapChars = this.chunkOverlap * 4;
    
    for (let i = 1; i < chunks.length; i++) {
      const prevChunk = chunks[i - 1];
      const overlapText = prevChunk.slice(-Math.min(overlapChars, prevChunk.length));
      result.push(overlapText + " " + chunks[i]);
    }
    
    return result;
  }
}

// --------------------------------------------
// RETRIEVER SERVICE
// --------------------------------------------
export class RetrieverService {
  private embeddingService: EmbeddingService;
  
  constructor(apiKey: string) {
    this.embeddingService = new EmbeddingService(apiKey);
  }
  
  async retrieve(
    query: string,
    topK: number = TOP_K_DEFAULT,
    filter?: Record<string, string>
  ): Promise<Array<{ id: string; content: string; score: number; metadata: Record<string, any> }>> {
    // Generar embedding de la query
    const queryEmbedding = await this.embeddingService.embedQuery(query);
    
    // Buscar en Pinecone
    const index = await getPineconeIndex();
    
    const results = await index.query({
      vector: queryEmbedding,
      topK: topK * 2, // Recuperar más para filtrar
      includeMetadata: true,
      filter: filter,
    });
    
    // Filtrar por umbral y limitar
    const filtered = (results.matches || [])
      .filter((match: { score?: number | null }) => Boolean(match.score && match.score >= SIMILARITY_THRESHOLD))
      .slice(0, topK)
      .map((match: { id: string; score?: number | null; metadata?: Record<string, unknown> }) => ({
        id: match.id,
        content: (match.metadata?.content as string) || "",
        score: match.score!,
        metadata: match.metadata || {},
      }));
    
    return filtered;
  }
}

// --------------------------------------------
// GENERATOR SERVICE
// --------------------------------------------
export class GeneratorService {
  private provider: TogetherProvider;
  private systemPrompt: string;
  
  constructor(apiKey: string) {
    this.provider = new TogetherProvider(apiKey);
    this.systemPrompt = `Eres un asistente inteligente especializado. Tu tarea es responder preguntas basándose ÚNICAMENTE en el contexto proporcionado.

REGLAS IMPORTANTES:
1. Responde SOLO usando la información del contexto proporcionado
2. Si la información no está en el contexto, di "No tengo suficiente información para responder"
3. Cita las fuentes cuando sea posible
4. Sé conciso pero completo
5. No inventes información`;
  }
  
  async generate(
    query: string,
    context: Array<{ content: string; metadata: Record<string, any> }>,
    customSystemPrompt?: string
  ): Promise<{ answer: string; usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined }> {
    // Construir contexto
    const contextText = context
      .map((doc, i) => `[Documento ${i + 1}]\nContenido: ${doc.content}`)
      .join("\n\n---\n\n");
    
    const messages = [
      { role: "system" as const, content: customSystemPrompt || this.systemPrompt.replace("{context}", contextText) },
      { role: "user" as const, content: `Contexto:\n${contextText}\n\nPregunta: ${query}` },
    ];
    
    const response = await this.provider.chat({
      model: LLM_MODEL,
      messages,
      temperature: 0.7,
      maxTokens: 2048,
    });
    
    const choice = response.choices[0];
    
    return {
      answer: choice.message.content || "",
      usage: response.usage,
    };
  }
}

// --------------------------------------------
// RAG PIPELINE
// --------------------------------------------
export class RAGPipeline {
  private retriever: RetrieverService;
  private generator: GeneratorService;
  
  constructor(apiKey: string) {
    this.retriever = new RetrieverService(apiKey);
    this.generator = new GeneratorService(apiKey);
  }
  
  async query(input: RagQueryInput): Promise<RagResponse> {
    // Verificar cache
    const cacheKey = `rag:${input.query}:${input.topK}`;
    const cached = await cacheGet<RagResponse>(cacheKey);
    if (cached) return cached;
    
    // Recuperar documentos
    const documents = await this.retriever.retrieve(
      input.query,
      input.topK,
      input.filters
    );
    
    if (!documents.length) {
      const emptyResponse: RagResponse = {
        answer: "No encontré información relevante para responder tu pregunta.",
        sources: [],
        model: LLM_MODEL,
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      };
      return emptyResponse;
    }
    
    // Generar respuesta
    const { answer, usage } = await this.generator.generate(
      input.query,
      documents,
      input.systemPrompt
    );

    const resolvedUsage = usage || {};
    
    const response: RagResponse = {
      answer,
      sources: documents.map(d => ({
        id: d.id,
        content: d.content.slice(0, 200) + "...",
        score: d.score,
        metadata: d.metadata,
      })),
      model: LLM_MODEL,
      usage: {
        promptTokens: resolvedUsage.prompt_tokens || 0,
        completionTokens: resolvedUsage.completion_tokens || 0,
        totalTokens: resolvedUsage.total_tokens || 0,
      },
    };
    
    // Cachear por 1 hora
    await cacheSet(cacheKey, response, 3600);
    
    return response;
  }
}

// --------------------------------------------
// INDEXER SERVICE
// --------------------------------------------
export class IndexerService {
  private embeddingService: EmbeddingService;
  private chunker: TextChunker;
  
  constructor(apiKey: string) {
    this.embeddingService = new EmbeddingService(apiKey);
    this.chunker = new TextChunker();
  }
  
  async indexDocuments(
    documents: Array<{ content: string; metadata?: Record<string, any> }>,
    userId: string
  ): Promise<{ documentsIndexed: number; chunksGenerated: number }> {
    const index = await getPineconeIndex();
    
    let totalChunks = 0;
    
    for (const doc of documents) {
      // Dividir en chunks
      const chunks = this.chunker.splitText(doc.content);
      totalChunks += chunks.length;
      
      // Generar embeddings
      const embeddings = await this.embeddingService.embedDocuments(chunks);
      
      // Preparar vectores para Pinecone
      const vectors = chunks.map((chunk, i) => ({
        id: `${userId}:${Date.now()}:${i}`,
        values: embeddings[i],
        metadata: {
          content: chunk,
          ...doc.metadata,
          chunkIndex: i,
          totalChunks: chunks.length,
        },
      }));
      
      // Insertar en batches
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert({ records: batch });
      }
    }
    
    return {
      documentsIndexed: documents.length,
      chunksGenerated: totalChunks,
    };
  }
}

// --------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------
export function getRAGPipeline(): RAGPipeline {
  const apiKey = process.env.TOGETHER_API_KEY!;
  return new RAGPipeline(apiKey);
}

export function getIndexerService(): IndexerService {
  const apiKey = process.env.TOGETHER_API_KEY!;
  return new IndexerService(apiKey);
}

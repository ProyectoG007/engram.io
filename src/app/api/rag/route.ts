// ============================================
// CAPA 4 + CAPA 9: RAG API
// --------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRAGPipeline, getIndexerService } from "@/services/rag-pipeline";
import { RagQuerySchema, RagIndexSchema } from "@/types";

// POST /api/rag/query - Consultar RAG
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Distinguir entre query e index
    if (body.action === "index") {
      const validated = RagIndexSchema.parse(body);
      const indexer = getIndexerService();
      
      const result = await indexer.indexDocuments(validated.documents, validated.userId);
      
      return NextResponse.json({ 
        success: true, 
        ...result,
        meta: { layer: 9, timestamp: new Date().toISOString() }
      });
    }
    
    // Query
    const validated = RagQuerySchema.parse(body);
    const ragPipeline = getRAGPipeline();
    
    const result = await ragPipeline.query(validated);
    
    return NextResponse.json({ 
      success: true, 
      data: result,
      meta: { layer: 9, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error("POST /api/rag error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Error en consulta RAG",
      meta: { layer: 9, timestamp: new Date().toISOString() }
    }, { status: 500 });
  }
}

// GET /api/rag - Verificar estado
export async function GET() {
  return NextResponse.json({
    status: "operational",
    layer: 9,
    models: {
      embedding: "intfloat/multilingual-e5-large-instruct",
      chat: "Qwen/Qwen2.5-7B-Instruct-Turbo"
    },
    timestamp: new Date().toISOString()
  });
}

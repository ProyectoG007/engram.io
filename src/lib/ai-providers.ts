// ============================================
// CAPA 4: SERVICIOS DE IA
// Multi-Provider AI Integration
// ============================================

import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

export type AIProviderType = "openai" | "together" | "gemini" | "anthropic";

export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      role: "assistant";
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

// --------------------------------------------
// OPENAI COMPATIBLE PROVIDER (Together, etc)
// --------------------------------------------
export class OpenAIProvider {
  private client: OpenAI;
  private baseURL?: string;
  
  constructor(apiKey: string, baseURL?: string) {
    this.client = new OpenAI({ 
      apiKey,
      baseURL: baseURL || undefined
    });
    this.baseURL = baseURL;
  }
  
  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const response = await this.client.chat.completions.create({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      top_p: options.topP ?? 0.9,
      stream: false,
    }) as ChatCompletion;
    
    return {
      choices: response.choices.map((choice: ChatCompletion["choices"][number]) => ({
        message: {
          role: "assistant",
          content: typeof choice.message.content === "string" ? choice.message.content : "",
        },
      })),
      usage: response.usage
        ? {
            prompt_tokens: response.usage.prompt_tokens,
            completion_tokens: response.usage.completion_tokens,
            total_tokens: response.usage.total_tokens,
          }
        : undefined,
    };
  }
  
  async embeddings(input: string[]) {
    const response = await this.client.embeddings.create({
      model: "text-embedding-3-small",
      input,
    });
    
    return response.data.map(d => d.embedding);
  }
}

export class TogetherProvider extends OpenAIProvider {
  constructor(apiKey: string) {
    super(apiKey, "https://api.together.xyz/v1");
  }
}

// --------------------------------------------
// GEMINI PROVIDER (Google AI)
// --------------------------------------------
export class GeminiProvider {
  private apiKey: string;
  private baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const response = await fetch(
      `${this.baseUrl}/models/${options.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: options.messages
            .filter(m => m.role !== "system")
            .map(m => ({ role: m.role, parts: [{ text: m.content }] })),
          generationConfig: {
            temperature: options.temperature,
            maxOutputTokens: options.maxTokens,
            topP: options.topP,
          },
        }),
      }
    );
    
    const data = await response.json();
    
    return {
      choices: [{
        message: {
          role: "assistant",
          content: data.candidates?.[0]?.content?.parts?.[0]?.text || "",
        },
      }],
      usage: data.usageMetadata,
    };
  }
}

// --------------------------------------------
// ANTHROPIC PROVIDER (Claude)
// --------------------------------------------
export class AnthropicProvider {
  private apiKey: string;
  private baseUrl = "https://api.anthropic.com/v1";
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async chat(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const systemPrompt = options.messages.find(m => m.role === "system");
    const userMessages = options.messages.filter(m => m.role !== "system");
    
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: options.model,
        messages: userMessages.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        system: systemPrompt?.content,
        temperature: options.temperature,
        max_tokens: options.maxTokens ?? 2048,
        top_p: options.topP,
      }),
    });
    
    const data = await response.json();
    
    return {
      choices: [{
        message: {
          role: "assistant",
          content: data.content?.[0]?.text || "",
        },
      }],
      usage: data.usage,
    };
  }
}

// --------------------------------------------
// AI ROUTER
// --------------------------------------------
export class AIRouter {
  private providers: Map<AIProviderType, OpenAIProvider | TogetherProvider | GeminiProvider | AnthropicProvider>;
  
  constructor() {
    this.providers = new Map();
  }
  
  getProvider(type: AIProviderType, apiKey: string, baseURL?: string) {
    if (!this.providers.has(type)) {
      switch (type) {
        case "openai":
          this.providers.set(type, new OpenAIProvider(apiKey, baseURL));
          break;
        case "together":
          this.providers.set(type, new TogetherProvider(apiKey));
          break;
        case "gemini":
          this.providers.set(type, new GeminiProvider(apiKey));
          break;
        case "anthropic":
          this.providers.set(type, new AnthropicProvider(apiKey));
          break;
      }
    }
    return this.providers.get(type);
  }
}

export const aiRouter = new AIRouter();

// --------------------------------------------
// DEFAULT MODELS
// --------------------------------------------
export const DEFAULT_MODELS = {
  openai: {
    chat: "gpt-4o-mini",
    chatLarge: "gpt-4o",
    embedding: "text-embedding-3-small",
  },
  together: {
    // Together AI es compatible con OpenAI SDK
    chat: "Qwen/Qwen2.5-7B-Instruct-Turbo",
    chatLarge: "meta-llama/Llama-3.1-70B-Instruct-Turbo",
    embedding: "BAAI/bge-en-icl",
  },
  gemini: {
    chat: "gemini-1.5-flash",
    chatLarge: "gemini-1.5-pro",
  },
  anthropic: {
    chat: "claude-3-5-haiku-20241022",
    chatLarge: "claude-3-5-sonnet-20241022",
  },
} as const;

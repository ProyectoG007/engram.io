// ============================================
// CAPA 3: LÓGICA DE NEGOCIO
// Tipos y estructuras core
// ============================================

import { z } from "zod";

// --------------------------------------------
// AGENT SCHEMAS
// --------------------------------------------
export const CreateAgentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["CHATBOT", "SCRAPER", "CODER", "ANALYZER", "CUSTOM"]).default("CUSTOM"),
  provider: z.enum(["TOGETHER", "GEMINI", "ANTHROPIC", "KIMI"]).default("TOGETHER"),
  systemPrompt: z.string().optional(),
  config: z.object({
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().min(1).max(4096).default(2048),
    topP: z.number().min(0).max(1).default(0.9),
  }).optional(),
});

export type CreateAgentInput = z.infer<typeof CreateAgentSchema>;

// --------------------------------------------
// TASK SCHEMAS
// --------------------------------------------
export const CreateTaskSchema = z.object({
  agentId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(["CHAT", "SCRAPE", "CODE", "ANALYZE", "RAG_QUERY"]).default("CHAT"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  input: z.record(z.any()).optional(),
});

export const TaskUpdateSchema = z.object({
  status: z.enum(["PENDING", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"]).optional(),
  output: z.record(z.any()).optional(),
  error: z.string().optional(),
  currentLayer: z.number().min(1).max(9).optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type TaskUpdateInput = z.infer<typeof TaskUpdateSchema>;

// --------------------------------------------
// RAG SCHEMAS (CAPA 9)
// --------------------------------------------
export const RagQuerySchema = z.object({
  query: z.string().min(1).max(1000),
  conversationId: z.string().optional(),
  topK: z.number().min(1).max(20).default(5),
  filters: z.record(z.string()).optional(),
  systemPrompt: z.string().optional(),
});

export const RagIndexSchema = z.object({
  documents: z.array(z.object({
    content: z.string(),
    metadata: z.record(z.any()).optional(),
  })),
  userId: z.string(),
});

export const RagResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(z.object({
    id: z.string(),
    content: z.string(),
    score: z.number(),
    metadata: z.record(z.any()),
  })),
  model: z.string(),
  usage: z.object({
    promptTokens: z.number(),
    completionTokens: z.number(),
    totalTokens: z.number(),
  }),
});

export type RagQueryInput = z.infer<typeof RagQuerySchema>;
export type RagIndexInput = z.infer<typeof RagIndexSchema>;
export type RagResponse = z.infer<typeof RagResponseSchema>;

// --------------------------------------------
// MESSAGE SCHEMAS
// --------------------------------------------
export const SendMessageSchema = z.object({
  conversationId: z.string().optional(),
  agentId: z.string(),
  content: z.string().min(1).max(10000),
  ragEnabled: z.boolean().default(true),
});

export const MessageResponseSchema = z.object({
  id: z.string(),
  role: z.enum(["USER", "ASSISTANT", "SYSTEM"]),
  content: z.string(),
  model: z.string().optional(),
  tokensUsed: z.number().optional(),
  sources: z.array(z.any()).optional(),
  createdAt: z.date(),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

// --------------------------------------------
// LAYER TRACKING (PROTOCOLO TITAN)
// --------------------------------------------
export const TITAN_LAYERS = [
  { id: 1, name: "Presentación", color: "#3B82F6", description: "UI/Frontend" },
  { id: 2, name: "Seguridad", color: "#EF4444", description: "Auth/Gatekeeper" },
  { id: 3, name: "Lógica", color: "#F59E0B", description: "Core Domain" },
  { id: 4, name: "Servicios", color: "#10B981", description: "API/Integrations" },
  { id: 5, name: "Persistencia", color: "#8B5CF6", description: "DB/Storage" },
  { id: 6, name: "Contratos", color: "#EC4899", description: "OpenSpec" },
  { id: 7, name: "Documentación", color: "#06B6D4", description: "Logs/Trazabilidad" },
  { id: 8, name: "IA Agentes", color: "#F97316", description: "Gentle-AI/Teams" },
  { id: 9, name: "Memoria RAG", color: "#84CC16", description: "Engram/Context" },
] as const;

export type TitanLayer = typeof TITAN_LAYERS[number];

// --------------------------------------------
// TELEGRAM SCHEMAS
// --------------------------------------------
export const TelegramCommandSchema = z.object({
  command: z.string(),
  args: z.string().optional(),
  userId: z.string(),
  chatId: z.string(),
});

export const TelegramMessageSchema = z.object({
  text: z.string(),
  parseMode: z.enum(["Markdown", "HTML"]).default("Markdown"),
  replyMarkup: z.any().optional(),
});

export type TelegramCommand = z.infer<typeof TelegramCommandSchema>;
export type TelegramMessage = z.infer<typeof TelegramMessageSchema>;

// --------------------------------------------
// API RESPONSE TYPES
// --------------------------------------------
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    layer?: number;
    timestamp: string;
    requestId?: string;
  };
}

export function successResponse<T>(data: T, layer?: number): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      layer,
      timestamp: new Date().toISOString(),
    },
  };
}

export function errorResponse(error: string, layer?: number): ApiResponse {
  return {
    success: false,
    error,
    meta: {
      layer,
      timestamp: new Date().toISOString(),
    },
  };
}

// ============================================
// CAPA 8: INTELIGENCIA ARTIFICIAL
// Agent Service - Gentle-AI Integration
// ============================================

import { prisma } from "@/lib/db";
import { getRAGPipeline } from "./rag-pipeline";
import { aiRouter, DEFAULT_MODELS } from "@/lib/ai-providers";
import type { CreateAgentInput, SendMessageInput } from "@/types";

// --------------------------------------------
// AGENT SERVICE
// --------------------------------------------
export class AgentService {
  async createAgent(userId: string, input: CreateAgentInput) {
    const agent = await prisma.agent.create({
      data: {
        userId,
        name: input.name,
        description: input.description,
        type: input.type,
        provider: input.provider,
        systemPrompt: input.systemPrompt,
        config: input.config,
      },
    });
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: "AGENT_CREATED",
        entity: "Agent",
        entityId: agent.id,
      },
    });
    
    return agent;
  }
  
  async getAgent(agentId: string) {
    return prisma.agent.findUnique({
      where: { id: agentId },
      include: { tasks: { take: 10, orderBy: { createdAt: "desc" } } },
    });
  }
  
  async listAgents(userId: string) {
    return prisma.agent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }
  
  async updateAgent(agentId: string, userId: string, data: Partial<CreateAgentInput>) {
    const agent = await prisma.agent.update({
      where: { id: agentId, userId },
      data,
    });
    
    await prisma.auditLog.create({
      data: {
        userId,
        action: "AGENT_UPDATED",
        entity: "Agent",
        entityId: agentId,
        details: data,
      },
    });
    
    return agent;
  }
  
  async deleteAgent(agentId: string, userId: string) {
    await prisma.agent.delete({
      where: { id: agentId, userId },
    });
    
    await prisma.auditLog.create({
      data: {
        userId,
        action: "AGENT_DELETED",
        entity: "Agent",
        entityId: agentId,
      },
    });
  }
}

// --------------------------------------------
// MESSAGE SERVICE
// --------------------------------------------
export class MessageService {
  private agentService = new AgentService();
  
  async sendMessage(userId: string, input: SendMessageInput) {
    // Obtener agente
    const agent = await this.agentService.getAgent(input.agentId);
    if (!agent) throw new Error("Agente no encontrado");
    
    // Crear o obtener conversación
    let conversation;
    if (input.conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: input.conversationId, userId },
      });
    }
    
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          agentId: agent.id,
          title: input.content.slice(0, 50),
          ragEnabled: input.ragEnabled,
        },
      });
    }
    
    // Guardar mensaje del usuario
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: input.content,
      },
    });
    
    // Construir contexto
    let context = "";
    
    if (input.ragEnabled) {
      const ragPipeline = getRAGPipeline();
      const ragResult = await ragPipeline.query({
        query: input.content,
        topK: 5,
      });
      
      if (ragResult.sources.length > 0) {
        context = ragResult.sources
          .map(s => s.content)
          .join("\n\n");
      }
    }
    
    // Construir prompt
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
    
    if (agent.systemPrompt) {
      messages.push({
        role: "system",
        content: agent.systemPrompt + (context ? `\n\nContexto relevante:\n${context}` : ""),
      });
    }
    
    // Obtener historial de conversación
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id, id: { not: userMessage.id } },
      take: 10,
      orderBy: { createdAt: "asc" },
    });
    
    history.forEach(h => {
      messages.push({ role: h.role as "user" | "assistant", content: h.content });
    });
    
    messages.push({ role: "user", content: input.content });
    
    // Obtener provider de IA
    const apiKeys: Record<string, string> = {
      together: process.env.TOGETHER_API_KEY!,
      gemini: process.env.GEMINI_API_KEY!,
      anthropic: process.env.ANTHROPIC_API_KEY!,
    };
    
    const providerType = agent.provider.toLowerCase() as "together" | "gemini" | "anthropic";
    const provider = aiRouter.getProvider(providerType, apiKeys[providerType]);
    
    // Obtener modelo
    const modelMap: Record<string, Record<string, string>> = {
      together: DEFAULT_MODELS.together,
      gemini: DEFAULT_MODELS.gemini,
      anthropic: DEFAULT_MODELS.anthropic,
    };
    
    const model = modelMap[providerType]?.chat || "default";
    
    // Hacer request
    const config = (agent.config as any) || {};
    const startTime = Date.now();
    
    const response = await provider.chat({
      model,
      messages,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2048,
      topP: config.topP ?? 0.9,
    });
    
    const latency = Date.now() - startTime;
    const choice = response.choices[0];
    const usage = response.usage || {};
    
    // Guardar respuesta
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: choice.message.content || "",
        model: model,
        tokensUsed: usage.total_tokens,
        latency,
        sources: input.ragEnabled ? context : null,
      },
    });
    
    // Actualizar métricas del agente
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
    
    return {
      message: assistantMessage,
      conversationId: conversation.id,
      ragContext: context,
    };
  }
  
  async getConversations(userId: string) {
    return prisma.conversation.findMany({
      where: { userId },
      include: {
        agent: { select: { name: true, type: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }
  
  async getConversationMessages(conversationId: string, userId: string) {
    return prisma.message.findMany({
      where: { conversation: { id: conversationId, userId } },
      orderBy: { createdAt: "asc" },
    });
  }
}

// --------------------------------------------
// TASK SERVICE
// --------------------------------------------
export class TaskService {
  async createTask(userId: string, data: any) {
    return prisma.task.create({
      data: {
        userId,
        ...data,
        currentLayer: 1, // Iniciar en Capa 1 del Protocolo TITAN
      },
    });
  }
  
  async updateTaskProgress(taskId: string, layer: number, status: string) {
    return prisma.task.update({
      where: { id: taskId },
      data: {
        currentLayer: layer,
        status,
        startedAt: layer === 1 ? new Date() : undefined,
        completedAt: layer === 9 && status === "COMPLETED" ? new Date() : undefined,
      },
    });
  }
  
  async listTasks(userId: string, status?: string) {
    return prisma.task.findMany({
      where: { userId, ...(status && { status: status as any }) },
      include: { agent: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
}

// --------------------------------------------
// EXPORTS
// --------------------------------------------
export const agentService = new AgentService();
export const messageService = new MessageService();
export const taskService = new TaskService();

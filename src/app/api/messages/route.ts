// ============================================
// CAPA 4: MESSAGES API
// --------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { messageService } from "@/services/agent-service";
import { SendMessageSchema } from "@/types";

// POST /api/messages - Enviar mensaje
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    const body = await request.json();
    const validated = SendMessageSchema.parse(body);
    
    const result = await messageService.sendMessage(session.user.id, validated);
    
    return NextResponse.json({ 
      message: result.message,
      conversationId: result.conversationId 
    });
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json({ error: "Error al enviar mensaje" }, { status: 500 });
  }
}

// GET /api/messages?conversationId=xxx - Obtener mensajes
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId requerido" }, { status: 400 });
    }
    
    const messages = await messageService.getConversationMessages(conversationId, session.user.id);
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 });
  }
}

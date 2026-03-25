// ============================================
// CAPA 4: AGENTS API
// --------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { agentService } from "@/services/agent-service";
import { CreateAgentSchema } from "@/types";

// GET /api/agents - Listar agentes
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    const agents = await agentService.listAgents(session.user.id);
    return NextResponse.json({ agents });
  } catch (error) {
    console.error("GET /api/agents error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST /api/agents - Crear agente
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    
    const body = await request.json();
    const validated = CreateAgentSchema.parse(body);
    
    const agent = await agentService.createAgent(session.user.id, validated);
    
    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error("POST /api/agents error:", error);
    return NextResponse.json({ error: "Error al crear agente" }, { status: 500 });
  }
}

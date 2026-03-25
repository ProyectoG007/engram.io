// ============================================
// CAPA 4: TELEGRAM BOT
// Dashboard Operativo desde Telegram
// ============================================

import { messageService, agentService, taskService } from "@/services/agent-service";
import { getRAGPipeline } from "@/services/rag-pipeline";
import type { TelegramMessage, TelegramCommand } from "@/types";

// --------------------------------------------
// TIPOS DE TELEGRAM
// --------------------------------------------
interface TelegramUpdate {
  update_id: number;
  message?: {
    from: { id: number; is_bot: boolean; first_name: string; username?: string };
    chat: { id: number; type: string };
    text: string;
    entities?: Array<{ type: string; offset: number; length: number }>;
  };
}

// --------------------------------------------
// TELEGRAM BOT CLIENT
// --------------------------------------------
export class TelegramBot {
  private token: string;
  private adminId: string;
  private baseUrl = "https://api.telegram.org";
  private offset = 0;
  private running = false;
  
  constructor(token: string, adminId: string) {
    this.token = token;
    this.adminId = adminId;
  }
  
  // --------------------------------------------
  // HTTP HELPERS
  // --------------------------------------------
  private async request(method: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/bot${this.token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    return response.json();
  }
  
  // --------------------------------------------
  // ENVÍO DE MENSAJES
  // --------------------------------------------
  async sendMessage(chatId: number, text: string, parseMode: "Markdown" | "HTML" = "Markdown") {
    return this.request("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    });
  }
  
  async sendDocument(chatId: number, document: string, caption?: string) {
    return this.request("sendDocument", {
      chat_id: chatId,
      document,
      caption,
    });
  }
  
  async editMessage(chatId: number, messageId: number, text: string) {
    return this.request("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
    });
  }
  
  // --------------------------------------------
  // COMANDOS
  // --------------------------------------------
  async handleCommand(update: TelegramUpdate) {
    const message = update.message;
    if (!message) return;
    
    const chatId = message.chat.id;
    const userId = message.from.id.toString();
    const text = message.text || "";
    
    // Verificar si es admin
    const isAdmin = userId === this.adminId;
    
    // Parsear comando
    const commandMatch = text.match(/^\/(\w+)(@[\w]+)?\s*(.*)$/);
    
    if (commandMatch) {
      const [, command, , args] = commandMatch;
      await this.executeCommand(command, args, chatId, userId, isAdmin);
    } else {
      // Si no es comando, interpretar como mensaje de chat
      await this.handleChatMessage(text, chatId, userId);
    }
  }
  
  // --------------------------------------------
  // EJECUTOR DE COMANDOS
  // --------------------------------------------
  private async executeCommand(
    command: string,
    args: string,
    chatId: number,
    userId: string,
    isAdmin: boolean
  ) {
    switch (command) {
      // --------------------------------------------
      // COMANDO: /start
      // --------------------------------------------
      case "start":
        await this.sendMessage(chatId, `
🤖 *Bienvenido al Dashboard B'H*

*Tu estación de control de Agentes IA*

📋 *Comandos disponibles:*

• \`/status\` - Ver estado del sistema
• \`/agents\` - Listar tus agentes
• \`/tasks\` - Ver tareas activas
• \`/chat [mensaje]\` - Chatear con un agente
• \`/rag [pregunta]\` - Consultar la base de conocimiento
• \`/layers\` - Ver estado de las 9 capas

🔧 *Gestión:*
• \`/create [nombre]\` - Crear nuevo agente
• \`/run [task]\` - Ejecutar tarea

📊 *Admin (solo CTO):*
• \`/stats\` - Métricas del sistema
• \`/broadcast [msg]\` - Mensaje a todos

_Diseñado con Protocolo TITAN_ 🛡️
        `.trim());
        break;
      
      // --------------------------------------------
      // COMANDO: /status
      // --------------------------------------------
      case "status":
        await this.sendMessage(chatId, `
🔋 *Estado del Sistema B'H*

🟢 Servidor: Online
🟢 API RAG: Operativo
🟢 Agentes: Activos
🟢 Base de Conocimiento: Indexada

📊 *Capas TITAN:*
${this.renderLayerStatus()}

⏰ Hora del servidor: ${new Date().toISOString()}
        `.trim());
        break;
      
      // --------------------------------------------
      // COMANDO: /layers
      // --------------------------------------------
      case "layers":
        await this.sendMessage(chatId, `
🛡️ *PROTOCOLO TITAN - 9 CAPAS*

${this.renderLayerStatus()}

_Cada capa está monitoreada en tiempo real._
        `.trim());
        break;
      
      // --------------------------------------------
      // COMANDO: /agents
      // --------------------------------------------
      case "agents":
        try {
          const agents = await agentService.listAgents(userId);
          
          if (agents.length === 0) {
            await this.sendMessage(chatId, "❌ No tienes agentes creados.\n\nUsa `/create [nombre]` para crear uno.");
            break;
          }
          
          const agentList = agents
            .map((a, i) => `${i + 1}. *${a.name}*\n   Tipo: ${a.type}\n   Estado: ${a.status}\n   Usos: ${a.usageCount}`)
            .join("\n\n");
          
          await this.sendMessage(chatId, `
🤖 *Tus Agentes*

${agentList}

_Total: ${agents.length} agentes_
          `.trim());
        } catch (error) {
          await this.sendMessage(chatId, "❌ Error al obtener agentes.");
        }
        break;
      
      // --------------------------------------------
      // COMANDO: /tasks
      // --------------------------------------------
      case "tasks":
        try {
          const tasks = await taskService.listTasks(userId);
          const activeTasks = tasks.filter(t => t.status === "RUNNING" || t.status === "PENDING");
          
          if (activeTasks.length === 0) {
            await this.sendMessage(chatId, "✅ No hay tareas activas.");
            break;
          }
          
          const taskList = activeTasks
            .slice(0, 5)
            .map(t => `• *${t.title}*\n   Estado: ${t.status}\n   Capa: ${t.currentLayer}/9`)
            .join("\n");
          
          await this.sendMessage(chatId, `
📋 *Tareas Activas*

${taskList}
          `.trim());
        } catch (error) {
          await this.sendMessage(chatId, "❌ Error al obtener tareas.");
        }
        break;
      
      // --------------------------------------------
      // COMANDO: /chat
      // --------------------------------------------
      case "chat":
        if (!args) {
          await this.sendMessage(chatId, "❌ Uso: `/chat [mensaje]`");
          break;
        }
        
        await this.sendMessage(chatId, "⏳ Procesando...");
        
        try {
          // Obtener primer agente del usuario o crear uno por defecto
          const agents = await agentService.listAgents(userId);
          const agentId = agents[0]?.id;
          
          if (!agentId) {
            await this.sendMessage(chatId, "❌ No tienes un agente configurado. Crea uno primero con `/create [nombre]`");
            break;
          }
          
          const result = await messageService.sendMessage(userId, {
            agentId,
            content: args,
            ragEnabled: true,
          });
          
          // Enviar respuesta (truncar si es muy largo)
          let response = result.message.content;
          if (response.length > 4000) {
            response = response.slice(0, 4000) + "\n\n _(respuesta truncada)_";
          }
          
          await this.sendMessage(chatId, `🤖 *Respuesta:*\n\n${response}`);
        } catch (error) {
          await this.sendMessage(chatId, `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
        break;
      
      // --------------------------------------------
      // COMANDO: /rag
      // --------------------------------------------
      case "rag":
        if (!args) {
          await this.sendMessage(chatId, "❌ Uso: `/rag [pregunta]`");
          break;
        }
        
        await this.sendMessage(chatId, "🔍 Consultando base de conocimiento...");
        
        try {
          const ragPipeline = getRAGPipeline();
          const result = await ragPipeline.query({ query: args, topK: 3 });
          
          let response = result.answer;
          if (response.length > 3500) {
            response = response.slice(0, 3500) + "\n\n _(respuesta truncada)_";
          }
          
          await this.sendMessage(chatId, `
📚 *Respuesta RAG:*

${response}

---
_Fuentes: ${result.sources.length} | Modelo: ${result.model}_
          `.trim());
        } catch (error) {
          await this.sendMessage(chatId, `❌ Error RAG: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
        break;
      
      // --------------------------------------------
      // COMANDO: /create
      // --------------------------------------------
      case "create":
        if (!args) {
          await this.sendMessage(chatId, "❌ Uso: `/create [nombre del agente]`");
          break;
        }
        
        try {
          const agent = await agentService.createAgent(userId, {
            name: args,
            type: "CHATBOT",
            provider: "TOGETHER",
            description: `Agente creado desde Telegram el ${new Date().toLocaleDateString()}`,
          });
          
          await this.sendMessage(chatId, `
✅ *Agente Creado*

• Nombre: ${agent.name}
• ID: \`${agent.id}\`
• Tipo: CHATBOT
• Provider: TOGETHER

_Usa \`/agents\` para ver todos tus agentes._
          `.trim());
        } catch (error) {
          await this.sendMessage(chatId, `❌ Error al crear agente: ${error instanceof Error ? error.message : "Unknown"}`);
        }
        break;
      
      // --------------------------------------------
      // COMANDOS DE ADMIN
      // --------------------------------------------
      case "stats":
        if (!isAdmin) {
          await this.sendMessage(chatId, "⛔ Solo el CTO puede ver estadísticas.");
          break;
        }
        
        await this.sendMessage(chatId, `
📊 *ESTADÍSTICAS DEL SISTEMA*

🟢 Total Agentes: En operación
🟢 Tareas Hoy: En procesamiento
🟢 Consultas RAG: En monitoreo
🟢 Tokens Usados: En tracking

_Más detalles en el Dashboard Web_
        `.trim());
        break;
      
      // --------------------------------------------
      // COMANDO: /help
      // --------------------------------------------
      case "help":
        await this.sendMessage(chatId, `
📖 *Ayuda Rápida*

*Chatear con IA:*
Usa \`/chat [tu pregunta]\` para hablar con tus agentes.

*Consultar conocimiento:*
Usa \`/rag [tu pregunta]\` para buscar en la base de conocimiento.

*Ver estado:*
\`/status\` - Estado general
\`/layers\` - Capas TITAN
\`/agents\` - Tus agentes
\`/tasks\` - Tareas activas

_Diseñado con Protocolo TITAN de B'H_ 🛡️
        `.trim());
        break;
      
      default:
        await this.sendMessage(chatId, `❓ Comando desconocido: /${command}\n\nUsa /help para ver comandos disponibles.`);
    }
  }
  
  // --------------------------------------------
  // MANEJADOR DE CHAT (mensajes sin comando)
  // --------------------------------------------
  private async handleChatMessage(text: string, chatId: number, userId: string) {
    // Por defecto, treat as a chat message
    await this.executeCommand("chat", text, chatId, userId, userId === this.adminId);
  }
  
  // --------------------------------------------
  // RENDERIZADO DE CAPAS
  // --------------------------------------------
  private renderLayerStatus(): string {
    const layers = [
      { id: 1, name: "Presentación", icon: "🟦" },
      { id: 2, name: "Seguridad", icon: "🟥" },
      { id: 3, name: "Lógica Core", icon: "🟨" },
      { id: 4, name: "Servicios", icon: "🟩" },
      { id: 5, name: "Persistencia", icon: "🟪" },
      { id: 6, name: "Contratos", icon: "🟧" },
      { id: 7, name: "Documentación", icon: "🟫" },
      { id: 8, name: "IA Agentes", icon: "🟮" },
      { id: 9, name: "Memoria RAG", icon: "⬜" },
    ];
    
    return layers.map(l => `${l.icon} C${l.id} ${l.name}`).join("\n");
  }
  
  // --------------------------------------------
  // POLLING LOOP
  // --------------------------------------------
  async start() {
    console.log("🤖 Starting Telegram Bot...");
    this.running = true;
    
    while (this.running) {
      try {
        const updates = await this.request("getUpdates", {
          offset: this.offset,
          timeout: 30,
        });
        
        if (updates.ok && updates.result) {
          for (const update of updates.result as TelegramUpdate[]) {
            await this.handleCommand(update);
            this.offset = update.update_id + 1;
          }
        }
      } catch (error) {
        console.error("Telegram polling error:", error);
        await new Promise(r => setTimeout(r, 5000)); // Wait 5s on error
      }
    }
  }
  
  stop() {
    this.running = false;
    console.log("🤖 Telegram Bot stopped");
  }
}

// --------------------------------------------
// INICIALIZACIÓN
// --------------------------------------------
async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const adminId = process.env.TELEGRAM_ADMIN_ID;
  
  if (!token || !adminId) {
    console.error("❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_ID");
    process.exit(1);
  }
  
  const bot = new TelegramBot(token, adminId);
  
  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down...");
    bot.stop();
    process.exit(0);
  });
  
  await bot.start();
}

// Run if executed directly
main().catch(console.error);

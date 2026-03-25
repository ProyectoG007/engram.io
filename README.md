# ============================================
# B'H SAAS - Agentes IA con Protocolo TITAN
# ============================================

<p align="center">
  <img src="https://img.shields.io/badge/Protocol-TITAN%209%20Capas-3B82F6" alt="TITAN Protocol">
  <img src="https://img.shields.io/badge/Framework-Next.js%2014-000000" alt="Next.js">
  <img src="https://img.shields.io/badge/AI-Together%20AI-FF6B6B" alt="Together AI">
  <img src="https://img.shields.io/badge/License-MIT" alt="License">
</p>

## Visión General

**B'H SaaS** es una plataforma SaaS de agentes de inteligencia artificial construida sobre el **Protocolo TITAN de 9 Capas**. Diseñada para crear, gestionar y operar agentes IA con memoria RAG persistente.

## Arquitectura de 9 Capas (Protocolo TITAN)

| Capa | Nombre | Descripción |
|------|--------|-------------|
| 1 | Presentación | Frontend Next.js con dashboard visual |
| 2 | Seguridad | Auth multi-provider (Google, GitHub) |
| 3 | Lógica Core | Agentes, tareas, mensajes |
| 4 | Servicios | API Routes + FastAPI RAG + Telegram |
| 5 | Persistencia | PostgreSQL, Redis, Pinecone |
| 6 | Contratos | OpenSpec documentation |
| 7 | Documentación | Logs estructurados, Swagger |
| 8 | IA Agentes | Gentle-AI, Agent Teams, Kimi |
| 9 | RAG Memory | Together AI embeddings + context |

## Stack Tecnológico

- **Frontend**: Next.js 14, Tailwind CSS, Shadcn/ui
- **Backend**: Next.js API Routes, FastAPI (RAG)
- **Database**: PostgreSQL (Prisma), Redis
- **Vector DB**: Pinecone
- **AI Providers**: Together AI, Gemini, Anthropic, Kimi
- **Telegram**: Bot operativo para управления

## Inicio Rápido

### 1. Clonar e Instalar

```bash
git clone <repo>
cd bh-saas
npm install
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
# Editar .env con tus API keys
```

### 3. Iniciar Servicios

```bash
# Base de datos
docker-compose up -d postgres redis

# Generar Prisma Client
npm run db:generate

# Crear tablas
npm run db:push

# Iniciar desarrollo
npm run dev
```

### 4. Acceder

- **Dashboard**: http://localhost:3000
- **RAG API**: http://localhost:8000
- **Telegram**: @tu_bot

## Comandos de Telegram

| Comando | Descripción |
|---------|-------------|
| `/start` | Bienvenida e instrucciones |
| `/status` | Estado del sistema |
| `/layers` | Ver 9 capas TITAN |
| `/agents` | Listar agentes |
| `/chat [msg]` | Chatear con agente |
| `/rag [pregunta]` | Consultar RAG |
| `/create [nombre]` | Crear agente |
| `/tasks` | Ver tareas activas |



## Estructura del Proyecto

```
bh-saas/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # NextAuth
│   │   │   ├── agents/        # CRUD Agentes
│   │   │   ├── messages/      # Chat
│   │   │   └── rag/           # RAG queries
│   │   ├── dashboard/         # Dashboard UI
│   │   └── page.tsx           # Home
│   ├── components/            # UI Components
│   ├── lib/                   # Utilities
│   ├── services/              # Business Logic
│   │   ├── rag-pipeline.ts    # RAG Pipeline
│   │   └── agent-service.ts   # Agents
│   ├── telegram/              # Telegram Bot
│   └── types/                 # TypeScript types
├── rag/                       # FastAPI RAG Service
├── prisma/                    # Database Schema
└── specs/                     # OpenSpec contracts
```

## API Endpoints

### Agentes
- `GET /api/agents` - Listar agentes
- `POST /api/agents` - Crear agente
- `GET /api/agents/[id]` - Ver agente
- `PUT /api/agents/[id]` - Actualizar agente
- `DELETE /api/agents/[id]` - Eliminar agente

### Mensajes
- `POST /api/messages` - Enviar mensaje
- `GET /api/messages?conversationId=` - Obtener mensajes

### RAG
- `POST /api/rag` - Consulta RAG
- `GET /api/rag` - Estado del servicio

## Contribuir

1. Fork el repositorio
2. Crear branch (`git checkout -b feature/nueva-funcion`)
3. Commit cambios (`git commit -am 'Agregar nueva función'`)
4. Push al branch (`git push origin feature/nueva-funcion`)
5. Crear Pull Request

## Licencia

MIT - B'H Blessed Holding

---

**B'H** - Protocolo TITAN de 9 Capas

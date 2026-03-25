# ============================================
# SPEC: BH-SAAS Core Architecture
# Version: 1.0.0
# Protocolo TITAN - 9 Capas
# ============================================

## Metadata

| Campo | Valor |
|-------|-------|
| **Nombre** | B'H SaaS - Agentes IA |
| **Versión** | 1.0.0 |
| **Autor** | B'H Blessed Holding |
| **Fecha** | 2026-03-25 |

---

## 1. Visión y Principios

### 1.1 Propósito
Plataforma SaaS para crear, gestionar y operar agentes de inteligencia artificial con memoria persistente RAG.

### 1.2 Principios
- **Protocolo TITAN**: Toda funcionalidad debe asignarse a una de las 9 capas
- **Escalabilidad**: Arquitectura que permite escalar horizontalmente
- **Multi-Provider**: Soporte para múltiples proveedores de IA
- **Mobile First**: Interfaz usable desde cualquier dispositivo

---

## 2. Arquitectura de 9 Capas (TITAN)

### Capa 1: Presentación (Frontend)
```
src/app/
├── page.tsx              # Landing page
├── dashboard/
│   └── page.tsx          # Dashboard principal
├── agents/
│   ├── page.tsx          # Lista de agentes
│   └── [id]/page.tsx     # Detalle de agente
├── rag/
│   └── page.tsx          # Interface RAG
└── layout.tsx            # Layout principal
```

**Tecnologías**: Next.js 14, Tailwind CSS, Shadcn/ui

### Capa 2: Seguridad y Autenticación
```
src/lib/auth.ts           # NextAuth configuration
prisma/schema.prisma      # User model + Auth tables
```

**Funcionalidades**:
- OAuth: Google, GitHub
- API Keys: Together, Gemini, Anthropic
- Rate Limiting: Redis-based

### Capa 3: Lógica de Negocio (Core)
```
src/types/index.ts        # Zod schemas
src/services/
├── agent-service.ts      # Agent CRUD + operations
├── rag-pipeline.ts       # RAG pipeline
└── task-service.ts       # Task management
```

**Entidades**: User, Agent, Task, Conversation, Message

### Capa 4: Servicios y API
```
src/app/api/
├── auth/[...nextauth]/   # NextAuth handlers
├── agents/route.ts       # Agent endpoints
├── messages/route.ts     # Message endpoints
├── rag/route.ts          # RAG endpoints
rag/
├── main.py               # FastAPI app
└── app/api/routes.py     # RAG API routes
```

### Capa 5: Persistencia
```
prisma/schema.prisma      # PostgreSQL models
src/lib/db.ts             # Prisma client + Redis
```

**Stores**:
- PostgreSQL: Users, Agents, Tasks, Messages
- Redis: Cache, Sessions, Rate limits
- Pinecone: Vector embeddings

### Capa 6: Contratos (OpenSpec)
```
specs/
├── agent-spec.md         # Agent contract
├── rag-spec.md           # RAG pipeline contract
└── api-contract.md       # API specification
```

### Capa 7: Documentación y Logs
```
src/lib/logger.ts         # Pino logger
app/api/*/route.ts        # Swagger docs
```

**Logging**: Pino.js, structured JSON logs

### Capa 8: Inteligencia Artificial
```
src/services/
├── ai-providers.ts       # Multi-provider router
├── agent-service.ts      # Agent orchestration
src/telegram/bot.ts       # Telegram integration
```

**Providers**:
- Together AI (primary)
- Google Gemini
- Anthropic Claude
- Kimi Code

### Capa 9: Memoria RAG
```
src/services/rag-pipeline.ts
rag/app/services/
├── embeddings.py          # E5 embeddings
├── retriever.py          # Vector search
└── generator.py          # LLM generation
```

**Pipeline**:
1. Index documents → chunks → embeddings
2. Query → embed → cosine similarity
3. Context + Query → LLM → Response

---

## 3. Modelos de Datos

### User
```typescript
{
  id: string
  email: string
  name: string?
  role: "USER" | "ADMIN" | "CTO"
  plan: "FREE" | "PRO" | "ENTERPRISE"
  preferences: Json
}
```

### Agent
```typescript
{
  id: string
  userId: string
  name: string
  type: "CHATBOT" | "SCRAPER" | "CODER" | "ANALYZER"
  provider: "TOGETHER" | "GEMINI" | "ANTHROPIC" | "KIMI"
  systemPrompt: string?
  config: { temperature, maxTokens, topP }
  status: "ACTIVE" | "INACTIVE" | "TRAINING" | "ERROR"
  usageCount: number
}
```

### Message
```typescript
{
  id: string
  conversationId: string
  role: "USER" | "ASSISTANT" | "SYSTEM"
  content: string
  model: string?
  tokensUsed: number?
  sources: Json? // RAG sources
}
```

---

## 4. API Endpoints

### Agentes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/agents` | Listar agentes del usuario |
| POST | `/api/agents` | Crear nuevo agente |
| GET | `/api/agents/[id]` | Obtener agente |
| PUT | `/api/agents/[id]` | Actualizar agente |
| DELETE | `/api/agents/[id]` | Eliminar agente |

### Mensajes
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/messages` | Enviar mensaje |
| GET | `/api/messages?conversationId=` | Obtener conversación |

### RAG
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/rag` | Consulta RAG |
| GET | `/api/rag` | Estado del servicio |

---

## 5. Telegram Commands

| Comando | Descripción | Capa |
|---------|-------------|------|
| `/start` | Bienvenida | 1 |
| `/status` | Estado del sistema | 7 |
| `/layers` | Ver 9 capas | 6 |
| `/agents` | Listar agentes | 3 |
| `/chat [msg]` | Chatear con IA | 8 |
| `/rag [query]` | Consultar RAG | 9 |
| `/create [name]` | Crear agente | 3 |
| `/tasks` | Ver tareas | 3 |

---

## 6. Flujos Principales

### 6.1 Creación de Agente
```
1. User → Dashboard → "Nuevo Agente"
2. POST /api/agents { name, type, provider }
3. Capa 3: Validar con Zod schema
4. Capa 5: Guardar en PostgreSQL
5. Capa 7: Log audit
6. Return: { agent }
```

### 6.2 Chat con Agente
```
1. User → Telegram /chat "mensaje"
2. Capa 4: Validar auth
3. Capa 3: Crear/get conversation
4. Capa 9: RAG query (si enabled)
5. Capa 8: Call AI provider
6. Capa 5: Guardar message
7. Capa 7: Log
8. Return: response
```

### 6.3 RAG Query
```
1. User → Dashboard → Ask Question
2. Capa 9: embed_query (E5)
3. Pinecone: similarity search (top-k)
4. Capa 9: generate_with_context (Qwen)
5. Capa 7: Log usage
6. Return: { answer, sources }
```

---

## 7. Métricas y Monitoreo

### 7.1 Métricas de Negocio
- Agentes creados por usuario
- Mensajes por conversación
- Consultas RAG por día
- Tokens utilizados por provider

### 7.2 Métricas Técnicas
- Latencia de API (p50, p95, p99)
- Errores por endpoint
- Uptime del sistema

### 7.3 Métricas RAG
- Recall@K
- Answer relevance
- Faithfulness score

---

## 8. Despliegue

### 8.1 Environments
- **Development**: localhost:3000
- **Staging**: Vercel preview
- **Production**: Railway + Vercel

### 8.2 Docker Services
- `web`: Next.js application
- `rag-api`: FastAPI RAG service
- `postgres`: Database
- `redis`: Cache
- `telegram-bot`: Telegram integration

---

## 9. Seguridad

### 9.1 Autenticación
- NextAuth.js con OAuth providers
- JWT para API sessions

### 9.2 Autorización
- Row-level security en PostgreSQL
- User can only access own data

### 9.3 Rate Limiting
- Redis-based sliding window
- 100 requests/min per user

### 9.4 Secrets
- API keys in environment variables
- Never commit .env files

---

## 10. Roadmap

### Fase 1 (Actual)
- [x] Autenticación
- [x] CRUD Agentes
- [x] Chat básico
- [x] RAG pipeline
- [x] Telegram bot
- [x] Dashboard

### Fase 2
- [ ] Webhooks para integrations
- [ ] Multi-file document upload
- [ ] Advanced RAG (reranking)
- [ ] Analytics dashboard

### Fase 3
- [ ] Team collaboration
- [ ] Custom training
- [ ] Enterprise SSO
- [ ] White-label

---

## Changelog

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0.0 | 2026-03-25 | Versión inicial |

---

**Documento creado bajo Protocolo TITAN de B'H Blessed Holding**

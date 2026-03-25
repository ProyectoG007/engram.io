# Pendientes del Proyecto (engram.io)

## Prioridad Alta

- [ ] Definir y documentar variables de entorno requeridas para web, bot y RAG (`.env.example`).
- [ ] Validar flujo completo de autenticación (signin, callback, error) y manejo de sesiones.
- [ ] Revisar seguridad de endpoints en `src/app/api/*` (autorización por ruta y validación de inputs).
- [ ] Confirmar estrategia de persistencia para Prisma (migraciones, seed y respaldo de DB).
- [ ] Verificar integración end-to-end de RAG (`src/app/api/rag/route.ts` <-> `rag/main.py`).
- [ ] Asegurar manejo de errores consistente en servicios críticos (`agent-service`, `rag-pipeline`, `telegram/bot.ts`).

## Prioridad Media

- [ ] Estandarizar logs (estructura JSON, niveles, contexto por request).
- [ ] Agregar validación de payloads en APIs (Zod u otra librería).
- [ ] Definir límites y timeouts para llamadas a proveedores de IA.
- [ ] Implementar tests mínimos:
  - [ ] Unitarios para `src/services/*`.
  - [ ] Integración para `src/app/api/*`.
  - [ ] Smoke test para flujo principal en frontend.
- [ ] Revisar UX de páginas clave (`/dashboard`, `/agents`, `/tasks`, `/rag`).
- [ ] Documentar arquitectura y flujo de datos entre módulos (web, bot, RAG, DB).

## Prioridad Baja

- [ ] Mejorar consistencia de nomenclatura y estructura de carpetas.
- [ ] Añadir linters/formatters estrictos si falta cobertura (ESLint/Prettier en todo el repo).
- [ ] Agregar métricas básicas (latencia API, errores por endpoint, uso de tokens IA).
- [ ] Preparar checklist de release (versionado, changelog, rollback).

## Docker y Deploy

- [ ] Revisar `Dockerfile.web`, `Dockerfile.bot` y `rag/Dockerfile` para optimizar tamaño de imagen.
- [ ] Confirmar `docker-compose.yml` con healthchecks y dependencias correctas.
- [ ] Definir estrategia de despliegue (staging/prod) y variables por entorno.
- [ ] Validar que no se incluyan secretos en imágenes ni repositorio.

## Documentación

- [ ] Actualizar `README.md` con:
  - [ ] Requisitos.
  - [ ] Setup local paso a paso.
  - [ ] Comandos principales.
  - [ ] Troubleshooting común.
- [ ] Crear guía rápida de operación del bot de Telegram.
- [ ] Crear guía rápida para mantenimiento del pipeline RAG.

## Backlog Técnico (Opcional)

- [ ] Cachear respuestas/embeddings cuando aplique.
- [ ] Implementar reintentos con backoff en integraciones externas.
- [ ] Añadir rate limiting para endpoints sensibles.
- [ ] Evaluar colas para tareas pesadas (procesamiento async).

---

Estado sugerido de seguimiento:
- `Pendiente`
- `En progreso`
- `Bloqueado`
- `Hecho`

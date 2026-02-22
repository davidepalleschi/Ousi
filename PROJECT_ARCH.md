# Project Blueprint: AI-Agent Monorepo

## 1. Stack Tecnologico
- **Manager Monorepo:** Turborepo
- **Linguaggio:** TypeScript (Strict Mode)
- **Frontend (apps/web):** Next.js 16+ (App Router) -> Target: Cloudflare Pages
- **Backend (apps/server):** Node.js (Fastify o Express) -> Target: Docker on VPS
- **Shared (packages/shared):** Zod Schemas & TypeScript Interfaces
- **Comunicazione:** tRPC (per Type-safety end-to-end)
- **Styling:** Tailwind CSS

## 2. Struttura del Progetto
L'agente deve seguire rigorosamente questa gerarchia:
/
├── apps/
│   ├── web/          # Next.js (Edge Runtime compatibile per Cloudflare)
│   └── server/       # Node.js (Backend in Docker)
├── packages/
│   └── shared/       # Zod schemas e tipi condivisi (il "cervello")
├── docker-compose.yml # Per orchestrare il backend localmente e su VPS
└── turbo.json        # Pipeline di build

## 3. Regole Operative per l'Agente AI
- **Types-First:** Prima di creare una feature, definisci lo schema Zod in `packages/shared`.
- **Cloudflare Compatibility:** In `apps/web`, usa solo API compatibili con Edge Runtime. Non usare librerie Node.js native (fs, path, child_process).
- **Dockerization:** Il backend in `apps/server` deve avere un Dockerfile multi-stage per produzione.
- **tRPC Workflow:** Ogni nuova procedura backend deve essere riflessa nel router tRPC per permettere al frontend di consumarla con auto-completamento.

## 4. Istruzioni per il Deploy
- **Frontend:** Deploy automatico tramite Cloudflare Pages (branch 'main').
- **Backend:** Esposizione su porta 3001, deploy su VPS tramite Docker Compose.
# 🤖 Agent Instructions & Project Standards (2026 Edition)

Benvenuto Agente. Questo è un monorepo TypeScript ad alte prestazioni. Segui queste regole per garantire la massima coerenza e velocità di esecuzione.

## 🏗️ Architettura & Deploy
- **Monorepo:** Gestito con Turborepo.
- **Frontend (apps/web):** Next.js 16+ (App Router). Target: **Cloudflare Pages**.
- **Backend (apps/server):** Node.js con Fastify e tRPC. Target: **Docker Container su VPS**.
- **Shared (packages/shared):** Contiene schemi Zod e tipi TypeScript.

## 🛠️ Regole d'oro per lo sviluppo
1. **Types-First Development:** Prima di implementare qualsiasi logica, definisci o aggiorna lo schema Zod in `packages/shared`. Non usare mai `any`.
2. **Edge Compatibility:** In `apps/web`, scrivi solo codice compatibile con le Edge Runtime di Cloudflare. Usa `export const runtime = 'edge'`.
3. **Communication:** La comunicazione tra Frontend e Backend avviene esclusivamente tramite **tRPC**. Non creare endpoint REST manuali a meno che non sia strettamente necessario per webhook esterni.
4. **React Compiler:** Non scrivere `useMemo` o `useCallback`. Confida nel React Compiler per l'ottimizzazione automatica.
5. **Styling:** Usa esclusivamente Tailwind CSS con l'approccio "Utility-First".

## 📦 Gestione Docker
- Il backend deve essere isolato in un container Docker multi-stage.
- Usa `docker-compose.yml` nella root per orchestrare lo sviluppo locale del backend e del database.

## 🚀 Workflow di modifica
Quando l'utente chiede una nuova funzionalità:
1. Modifica/Crea lo schema in `packages/shared/src/schemas/`.
2. Implementa la procedura nel router di `apps/server/src/trpc/`.
3. Crea il componente UI in `apps/web/src/features/` consumando la procedura tRPC.
# Ousi

> **Intelligent News Curation** — your personal AI agent that reads the web for you and delivers a curated, personalized digest.

Ousi is an open-source web app that autonomously discovers, scores, and synthesizes news articles based on your professional profile. Instead of drowning in RSS feeds or social media, you get a clean digest of the articles that actually matter to you — rewritten and ranked by AI.

---

## ✨ How it works

1. **Discovery** — articles are pulled from NewsAPI and RSS feeds on demand.
2. **Extraction** — [Firecrawl](https://firecrawl.dev) scrapes each URL into clean Markdown, stripping ads, banners, and boilerplate.
3. **AI Scoring** — [DeepSeek](https://deepseek.com) reads your profile ("identikit") and assigns a relevance score (1–10) to every article.
4. **Personalization** — high-scoring articles are fully rewritten by the AI to match your background and interests.
5. **Newsletter** — a curated HTML digest is sent to your inbox via [Resend](https://resend.com).

All of this runs as a streaming pipeline, so you see articles appear in your dashboard in real time as they're processed.

---

## 🖥 Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | [Turborepo](https://turbo.build) |
| Frontend | [Next.js 15](https://nextjs.org) (App Router) · TypeScript · Tailwind CSS |
| Backend | Node.js · [Prisma ORM](https://prisma.io) |
| Database | PostgreSQL 16 |
| Auth | [Better Auth](https://better-auth.com) |
| AI | DeepSeek API |
| Scraping | Firecrawl API |
| Email | Resend API |
| Infra | Docker Compose · Cloudflare Pages (frontend) |

---

## 📁 Project Structure

```
/
├── apps/
│   ├── web/          # Next.js frontend (dashboard, auth, onboarding)
│   └── server/       # Node.js backend + Prisma schema
├── packages/
│   └── shared/       # Shared Zod schemas and TypeScript types
├── docker-compose.yml
└── turbo.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 20
- Docker & Docker Compose
- API keys: **DeepSeek**, **Firecrawl**, **Resend**, **NewsAPI**

### 1. Clone and install

```bash
git clone https://github.com/davidepalleschi/Ousi.git
cd Ousi
npm install
```

### 2. Set up environment variables

Copy the example env file for the web app:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill in the required variables:

```env
# Database
DATABASE_URL=postgresql://ousi:ousi@localhost:5432/ousi

# Better Auth
BETTER_AUTH_SECRET=your_secret_here
BETTER_AUTH_URL=http://localhost:3000

# AI & Scraping
DEEPSEEK_API_KEY=your_deepseek_key
FIRECRAWL_API_KEY=your_firecrawl_key

# Email
RESEND_API_KEY=your_resend_key
RESEND_FROM_EMAIL=newsletter@yourdomain.com

# News
NEWS_API_KEY=your_newsapi_key
```

### 3. Start the database

```bash
docker compose up db -d
```

### 4. Run database migrations

```bash
cd apps/server
npx prisma migrate deploy
# or for development:
npx prisma migrate dev
```

### 5. Start the development server

```bash
# From the root — starts all apps in parallel
npm run dev

# Or individually:
npm run dev:web     # Next.js on http://localhost:3000
npm run dev:server  # API server on http://localhost:3001
```

---

## 🗺 Key Features

- **Onboarding flow** — complete a profile wizard that generates your "identikit": role, skills, interests, and topics to avoid.
- **Real-time feed refresh** — articles stream into your dashboard live via Server-Sent Events as they're processed.
- **Personalized articles** — articles scored ≥ 8/10 are fully rewritten by DeepSeek tailored to your background.
- **Newsletter delivery** — send your curated digest directly to your inbox with one click.
- **Clean, minimal UI** — ultra-minimal design with a warm monochrome palette and smooth Framer Motion animations.

---

## 🐳 Production Deployment

The backend is fully dockerized. Run the full stack:

```bash
docker compose up --build -d
```

The frontend is designed for deployment on **Cloudflare Pages** (Edge Runtime compatible). Connect your GitHub repo to Cloudflare Pages for automatic deployments on every push to `main`.

---

## 📄 License

MIT
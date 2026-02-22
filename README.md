### 📝 Prompt per l'Agente IDE: Inizializzazione Progetto "Ousi"

> **Project Name:** Ousi
> **Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Firecrawl (Crawl/Map API), Deepseek api, Resend (Email).
> **1. Obiettivo del Progetto**
> Realizzare una webapp di "Intelligent News Curation" che automatizza la scoperta, il filtraggio e la sintesi di notizie web. Il sistema deve fungere da agente autonomo che "legge il web per l'utente" e invia una newsletter personalizzata via email.
> **2. Core Logic (The Pipeline)**
> L'applicazione deve eseguire i seguenti step in modo sequenziale (Cron Job):
> 1. **Discovery:** Recuperare una lista di URL recenti tramite NewsAPI o feed RSS predefiniti.
> 2. **Extraction (Firecrawl):** Utilizzare Firecrawl per scansionare gli URL e ottenere il contenuto in formato Markdown pulito, eliminando boilerplate (cookie banner, ads, menu).
> 3. **AI Filtering:** Invece di un Vector DB, confrontare il Markdown ottenuto con un "Identikit Utente" salvato come testo strutturato (JSON) nel database. L'LLM deve assegnare un punteggio di rilevanza (1-10).
> 4. **Synthesis:** Gli articoli con punteggio > 8 vengono sintetizzati in una newsletter in formato HTML/Markdown.
> 5. **Delivery:** Invio tramite Resend all'indirizzo email dell'utente.
> 
> 
> **3. Struttura Dati (PostgreSQL)**
> * **Table `profiles`:** >   - `id`: UUID (FK to Better Auth)
> * `email`: string
> * `user_identikit`: JSONB (Contiene: ruolo professionale, competenze tecniche, interessi core, argomenti da evitare).
> * `newsletter_frequency`: enum (daily, weekly).
> 
> 
> * **Table `processed_articles`:**
> * `url_hash`: string (unique) per evitare duplicati.
> * `summary`: text.
> * `sent_at`: timestamp.
> 
> 
> 
> 
> **4. Requisiti Funzionali Immediati (MVP)**
> * Setup del database PostgreSQL locale e autenticazione Better Auth.
> * UI di Onboarding: Un form fluido per generare il `user_identikit`.
> * Backend Action: Uno script (Edge Function o Route Handler) che integri Firecrawl e un LLM per processare un singolo URL di test.
> * Template Email: Layout pulito ed essenziale (stile "Minimalist Newsletter").
> 
> 
> 
> 
> **5. Linee Guida di Design**
> * **Branding:** Nome "Ousi", stile ultra-minimale, bianco/nero con accenti tech (es. `#00FF41` o Gold).
> * **Icona:** Concetto del "Mirino": due angoli che inquadrano un punto centrale.
> 
> 
> **Istruzioni per l'Agente:**
> Inizia analizzando la struttura del progetto Next.js. Proponi la struttura delle cartelle e i file necessari per lo schema del database e le prime API route per l'integrazione con Firecrawl.
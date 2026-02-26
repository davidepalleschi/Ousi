import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";
import { discoverArticles } from "../../feed/discoverService";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const PHASE1_TOP_N = 8;
const PHASE1_MIN_SCORE = 5;
const PHASE2_MIN_SCORE = 7;

// ── SSE event types ───────────────────────────────────────────────────────
type ProgressEvent =
    | { type: "status"; icon: string; message: string }
    | { type: "article"; icon: string; message: string; score?: number }
    | { type: "article_ready"; article: any }
    | { type: "done"; processed: number; message?: string }
    | { type: "error"; message: string };

// ── Phase 1: Batch Deepseek scoring ───────────────────────────────────────
async function batchScore(
    articles: Array<{ title: string; description: string }>,
    identikit: { role: string; skills: string[]; interests: string[]; avoidTopics: string[]; aiProfile?: string }
): Promise<Array<{ score: number; summary: string; translatedTitle: string; tags: string[] }>> {
    const profileSection = identikit.aiProfile
        ? `Profilo narrativo dell'utente:\n"${identikit.aiProfile}"\n\nDettagli tecnici:\n- Ruolo: ${identikit.role}\n- Competenze: ${(identikit.skills ?? []).join(", ")}\n- Argomenti da evitare ASSOLUTAMENTE: ${(identikit.avoidTopics ?? []).join(", ")}`
        : `- Ruolo: ${identikit.role}\n- Competenze: ${(identikit.skills ?? []).join(", ")}\n- Interessi: ${(identikit.interests ?? []).join(", ")}\n- Argomenti da evitare ASSOLUTAMENTE: ${(identikit.avoidTopics ?? []).join(", ")}`;

    const prompt = `Sei un assistente di curazione notizie. Profilo utente:
${profileSection}

Per ogni articolo nella lista JSON, assegna un punteggio di rilevanza da 1 a 10, scrivi un brevissimo sommario (1 frase in italiano), traduci il titolo in italiano e aggiungi 2-3 tag di categoria pertinenti.

Regole:
- Score 9-10: articolo perfettamente in linea col profilo
- Score 1-3: argomento irrilevante o da evitare
- MUST return a valid JSON OBJECT with a single key "results" containing the array of evaluations:
{"results": [{"score": 9, "summary": "...", "translatedTitle": "Titolo in Italiano...", "tags": ["Tech", "AI"]}, ...]}

Lista articoli:
${JSON.stringify(articles.map((a, i) => ({ i, title: a.title, description: a.description })))}`;

    let res;
    let data;
    try {
        res = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.2,
                max_tokens: 8000,
                response_format: { type: "json_object" }
            }),
            signal: AbortSignal.timeout(120_000), // Aumentato a 120 secondi
        });

        if (!res.ok) return articles.map(() => ({ score: 5, summary: "", translatedTitle: "", tags: [] }));

        data = await res.json();
    } catch (error: any) {
        console.error("[batchScore] Fetch o lettura body fallita per timeout:", error);
        throw error;
    }


    const raw = data.choices?.[0]?.message?.content ?? '{"results": []}';
    try {
        const cleaned = raw.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        const articlesArray = Array.isArray(parsed) ? parsed : (parsed.results || []);
        if (!Array.isArray(articlesArray)) throw new Error("Not an array in results");
        return articlesArray.map((p: any) => ({
            score: typeof p.score === "number" ? Math.round(p.score) : 5,
            summary: typeof p.summary === "string" ? p.summary : "",
            translatedTitle: typeof p.translatedTitle === "string" ? p.translatedTitle : "",
            tags: Array.isArray(p.tags) ? p.tags : [],
        }));
    } catch (e) {
        console.error("[batchScore] Fallimento nel parsing del JSON restituito da Deepseek:", e);
        console.error("[batchScore] Output grezzo del modello:", raw);
        return articles.map(() => ({ score: 5, summary: "", translatedTitle: "", tags: [] }));
    }
}

// ── Firecrawl scraper ──────────────────────────────────────────────────────
async function scrapeArticle(url: string): Promise<string> {
    const baseUrl = (process.env.FIRECRAWL_BASE_URL ?? "https://api.firecrawl.dev").replace(/\/$/, "");
    try {
        const res = await fetch(`${baseUrl}/v1/scrape`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY ?? ""}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
            signal: AbortSignal.timeout(60_000), // Aumentato a 60 secondi
        });
        if (!res.ok) return "";
        const data = await res.json();
        return (data?.data?.markdown ?? "").slice(0, 10000);
    } catch (error: any) {
        console.error(`[scrapeArticle] Fetch failed or timed out per ${url}:`, error);
        return "";
    }
}

// ── Deepseek: clean + summarize (all scraped articles) ───────────────────
async function summarizeWithDeepseek(rawContent: string, title: string): Promise<string> {
    const prompt = `Hai estratto il contenuto grezzo di una pagina web che può contenere: menu di navigazione, pubblicità, pop-up, cookie banner, link "iscriviti", sezioni "articoli correlati", note legali. Ignora tutto questo.

Tuo compito: estrai SOLO il contenuto giornalistico dell'articolo intitolato "${title}" e scrivi un RIASSUNTO in italiano di 7-10 righe.

Regole:
- Spiega chiaramente di cosa parla l'articolo e i punti chiave
- Includi dati e cifre importanti se presenti
- Scrivi in modo fluido e professionale, senza pubblicità né giri di parole
- Inizia direttamente con il contenuto, senza preamboli ("Questo articolo...", "L'articolo tratta...")

Contenuto grezzo:
${rawContent.slice(0, 8000)}`;

    let res;
    let data;
    try {
        res = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                max_tokens: 500,
            }),
            signal: AbortSignal.timeout(45_000), // Aumentato a 45 secondi
        });
        if (!res.ok) return "";
        data = await res.json();
    } catch (error: any) {
        console.error(`[summarizeWithDeepseek] Fetch failed or timed out per "${title}":`, error);
        throw error;
    }
    return data.choices?.[0]?.message?.content?.trim() ?? "";
}

// ── Deepseek: clean + personalize (top articles only) ────────────────────
async function personalizeWithDeepseek(
    content: string,
    title: string,
    identikit: { role: string; skills: string[]; interests: string[]; avoidTopics: string[]; aiProfile?: string }
): Promise<string> {
    const profileSection = identikit.aiProfile
        ? `Profilo utente:\n"${identikit.aiProfile}"`
        : `- Ruolo: ${identikit.role}\n- Competenze: ${(identikit.skills ?? []).join(", ")}\n- Interessi: ${(identikit.interests ?? []).join(", ")}`;

    const prompt = `Hai estratto il contenuto grezzo di una pagina web che può contenere: menu di navigazione, pubblicità, pop-up, cookie banner, link "iscriviti", sezioni "articoli correlati", note legali. Ignora tutto questo materiale.

Tuo compito: estrai SOLO il contenuto giornalistico dell'articolo "${title}" e riscrivilo in italiano con questa struttura Markdown obbligatoria:

## Riepilogo
[Riassunto pulito e oggettivo di 7-10 righe che spiega chiaramente di cosa parla l'articolo e i suoi punti chiave]

## Approfondimento personalizzato
[Analisi di 300-400 parole adattata al profilo:
${profileSection}
Evidenzia gli aspetti più rilevanti per questo profilo, usa **grassetto** per i concetti chiave ed elenchi puntati dove utile]

Regole ferree:
- Zero pubblicità, zero inviti a iscriversi, zero link promozionali
- Zero frasi meta ("come descritto...", "l'autore afferma...", "l'articolo spiega...")
- Tono giornalistico professionale, diretto
- Inizia immediatamente con "## Riepilogo", senza nessun preambolo

Contenuto grezzo:
${content}`;

    let res;
    let data;
    try {
        res = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.4,
                max_tokens: 1500,
            }),
            signal: AbortSignal.timeout(90_000), // Aumentato a 90 secondi
        });
        if (!res.ok) return "";
        data = await res.json();
    } catch (error: any) {
        console.error(`[personalizeWithDeepseek] Fetch failed or timed out per "${title}":`, error);
        throw error;
    }
    return data.choices?.[0]?.message?.content?.trim() ?? "";
}

// ── Main: SSE streaming route ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return new Response("Unauthorized", { status: 401 });

    const encoder = new TextEncoder();
    const cookieHeader = req.headers.get("cookie") ?? "";

    const stream = new ReadableStream({
        async start(controller) {
            const send = (event: ProgressEvent) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
            };

            try {
                // Step 1: Check profile
                const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
                if (!profile?.userIdentikit) {
                    send({ type: "error", message: "Completa prima il profilo nell'onboarding." });
                    controller.close();
                    return;
                }
                const identikit = profile.userIdentikit as {
                    role: string; skills: string[]; interests: string[]; avoidTopics: string[]; aiProfile?: string;
                };

                // Step 2: Discovery
                console.log("[Refresh API] Step 2: Inizio discovery articoli...");
                send({ type: "status", icon: "🔍", message: "Ricerca articoli in corso…" });
                try {
                    var discovered = await discoverArticles(identikit.interests, identikit.skills, identikit.role);
                } catch (fetchErr: any) {
                    console.error("[Refresh API] Eccezione grave in discoverArticles:", fetchErr);
                    send({ type: "error", message: `Discovery fallita: ${fetchErr.message}` });
                    controller.close();
                    return;
                }

                if (!discovered?.length) {
                    send({ type: "status", icon: "😶", message: "Nessun articolo trovato." });
                    send({ type: "done", processed: 0 });
                    controller.close();
                    return;
                }
                console.log(`[Refresh API] Step 2 completato: trovati ${discovered.length} articoli totali.`);
                send({ type: "status", icon: "📡", message: `Trovati ${discovered.length} articoli da RSS e NewsAPI` });

                // Step 3: Filter already processed
                console.log("[Refresh API] Step 3: Filtraggio articoli già processati...");
                const hashes = discovered.map((a: any) =>
                    createHash("sha256").update(a.url).digest("hex").slice(0, 16)
                );
                const existing = await prisma.scoredArticle.findMany({
                    where: { userId: session.user.id, urlHash: { in: hashes } },
                    select: { urlHash: true },
                });
                const existingSet = new Set(existing.map((e: any) => e.urlHash));
                const fresh = discovered.filter((_: any, i: number) => !existingSet.has(hashes[i]));

                if (fresh.length === 0) {
                    send({ type: "status", icon: "✅", message: "Tutti gli articoli sono già stati analizzati." });
                    const all = await prisma.scoredArticle.findMany({
                        where: { userId: session.user.id },
                        orderBy: { relevanceScore: "desc" },
                        take: 50,
                    });
                    for (const a of all) send({ type: "article_ready", article: a });
                    send({ type: "done", processed: 0 });
                    controller.close();
                    return;
                }

                // Limit to max 30 articles as requested
                if (fresh.length > 30) {
                    send({ type: "status", icon: "✂️", message: `Trovati molti articoli: analizzo i primi 30 nuovi articoli.` });
                    fresh.splice(30);
                }

                send({ type: "status", icon: "🆕", message: `${fresh.length} nuovi articoli da analizzare` });

                // Step 4: Batch scoring
                console.log(`[Refresh API] Step 4: Inizio Batch Scoring su ${fresh.length} nuovi articoli tramite Deepseek...`);
                send({ type: "status", icon: "🤖", message: `Deepseek sta valutando ${fresh.length} articoli…` });

                const SCORE_BATCH_SIZE = 10;
                let scores: any[] = [];
                for (let i = 0; i < fresh.length; i += SCORE_BATCH_SIZE) {
                    const batch = fresh.slice(i, i + SCORE_BATCH_SIZE);
                    if (fresh.length > SCORE_BATCH_SIZE) {
                        send({ type: "status", icon: "🧠", message: `Valutazione batch ${Math.floor(i / SCORE_BATCH_SIZE) + 1} di ${Math.ceil(fresh.length / SCORE_BATCH_SIZE)} (${batch.length} articoli)…` });
                    }
                    console.log(`[Refresh API] BatchScoring invio batch di ${batch.length} articoli a Deepseek...`);
                    const batchScores = await batchScore(
                        batch.map((a: any) => ({ title: a.title, description: a.description ?? "" })),
                        identikit
                    );
                    console.log(`[Refresh API] BatchScoring ritornati ${batchScores.length} risultati da Deepseek.`);
                    scores = scores.concat(batchScores);
                }
                console.log(`[Refresh API] Step 4 completato.`);

                const scored = fresh
                    .map((a: any, i: number) => ({
                        ...a,
                        score: scores[i]?.score ?? 5,
                        summary: scores[i]?.summary ?? "",
                        translatedTitle: scores[i]?.translatedTitle ?? "",
                        tags: scores[i]?.tags ?? [],
                        urlHash: hashes[discovered.indexOf(a)],
                    }))
                    .filter((a: any) => a.score >= PHASE1_MIN_SCORE)
                    .sort((a: any, b: any) => b.score - a.score);

                const discarded = fresh.length - scored.length;
                send({
                    type: "status", icon: "🎯",
                    message: `${scored.length} articoli rilevanti trovati${discarded > 0 ? `, ${discarded} scartati` : ""}`,
                });

                // Step 5: Parallel batch scrape + personalize
                console.log(`[Refresh API] Step 5: Inizio scraping e personalizzazione parallela (batch da 5) per ${scored.length} articoli rilevanti...`);
                const BATCH_SIZE = 5;
                send({ type: "status", icon: "✦", message: `Elaborazione in parallelo di ${scored.length} articoli (blocchi da ${BATCH_SIZE})…` });

                for (let i = 0; i < scored.length; i += BATCH_SIZE) {
                    const batch = scored.slice(i, i + BATCH_SIZE);
                    await Promise.all(batch.map(async (a: any) => {
                        const shortTitle = a.title.length > 55 ? a.title.slice(0, 55) + "…" : a.title;
                        send({ type: "article", icon: "🔥", message: shortTitle, score: a.score });
                        console.log(`[Refresh API] Inizio scraping Firecrawl per: ${shortTitle}`);
                        const fullContent = await scrapeArticle(a.url);
                        console.log(`[Refresh API] Firecrawl concluso per: ${shortTitle}, chiamo Deepseek per personalizzazione...`);
                        const personalized = await personalizeWithDeepseek(fullContent, a.title, identikit);
                        console.log(`[Refresh API] Deepseek personalizzazione conclusa per: ${shortTitle}, salvataggio nel database...`);
                        const saved = await prisma.scoredArticle.upsert({
                            where: { userId_urlHash: { userId: session.user.id, urlHash: a.urlHash } },
                            create: {
                                userId: session.user.id, url: a.url, urlHash: a.urlHash,
                                title: a.title, description: a.description ?? "",
                                summary: a.summary, personalizedContent: personalized, rawContent: fullContent,
                                translatedTitle: a.translatedTitle, tags: a.tags,
                                relevanceScore: a.score, source: a.source,
                                publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
                            },
                            update: { summary: a.summary, personalizedContent: personalized, rawContent: fullContent, relevanceScore: a.score, translatedTitle: a.translatedTitle, tags: a.tags },
                        });
                        // Stream article immediately so client can display it
                        send({ type: "article_ready", article: saved });
                    }));
                    if (i + BATCH_SIZE < scored.length) {
                        const remaining = scored.length - i - BATCH_SIZE;
                        send({ type: "status", icon: "⏳", message: `${i + BATCH_SIZE}/${scored.length} completati — ancora ${remaining}…` });
                    }
                }
                console.log(`[Refresh API] Fine di tutti i processi. Elaborati ${fresh.length} articoli.`);

                send({ type: "done", processed: fresh.length });

            } catch (e: any) {
                console.error("[Refresh API] Errore gestito nel blocco principale:", e);
                send({ type: "error", message: e?.message ?? "Errore interno del server." });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}

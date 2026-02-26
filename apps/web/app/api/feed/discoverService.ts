import { pickFeeds } from "./utils";

export interface RawArticle {
    url: string;
    title: string;
    description: string;
    source: "newsapi" | "rss";
    publishedAt?: string;
}

export function parseRssFeed(xml: string, sourceName: string): RawArticle[] {
    const items: RawArticle[] = [];
    const blocks = Array.from(xml.matchAll(/<(?:item|entry)[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi));
    for (const block of blocks.slice(0, 10)) {
        const c = block[1];
        const link =
            c.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1] ||
            c.match(/<link[^>]*>(https?:\/\/[^<]+)<\/link>/i)?.[1] ||
            c.match(/<guid[^>]*>(https?:\/\/[^<]+)<\/guid>/i)?.[1];
        const title = c.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim();
        const desc = (
            c.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1] ||
            c.match(/<summary[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/summary>/i)?.[1] ||
            ""
        ).replace(/<[^>]+>/g, "").trim().slice(0, 300); // strip HTML tags
        const pubDate = c.match(/<(?:pubDate|published|updated)[^>]*>([\s\S]*?)<\/(?:pubDate|published|updated)>/i)?.[1]?.trim();

        if (link && title) {
            items.push({ url: link.trim(), title, description: desc, source: sourceName as any, publishedAt: pubDate });
        }
    }
    return items;
}

export async function discoverArticles(interests: string[] = [], skills: string[] = [], role: string = "", sources: string[] = ["newsapi", "rss"]): Promise<RawArticle[]> {
    const discovered: RawArticle[] = [];
    const seen = new Set<string>();
    const hoursBack = 48; // focus on last 48h
    const fromDate = new Date(Date.now() - hoursBack * 3600 * 1000).toISOString().split("T")[0];

    // ── 1. NewsAPI ────────────────────────────────────────────────────────────
    if (sources.includes("newsapi") && process.env.NEWSAPI_KEY) {
        // Build a rich query from user profile
        const skillTerms = (skills as string[]).slice(0, 4).join(" OR ");
        const interestTerms = (interests as string[]).slice(0, 4).join(" OR ");
        const query = [skillTerms, interestTerms].filter(Boolean).join(" OR ");

        if (query) {
            console.log(`[NewsAPI] 🔍 Query: "${query}" | from: ${fromDate} | ruolo: ${role}`);
            try {
                const url =
                    `https://newsapi.org/v2/everything` +
                    `?q=${encodeURIComponent(query)}` +
                    `&language=en&sortBy=publishedAt&pageSize=20` +
                    `&from=${fromDate}`;
                const res = await fetch(url, { headers: { "X-Api-Key": process.env.NEWSAPI_KEY } });
                if (res.ok) {
                    const data = await res.json();
                    let count = 0;
                    for (const a of data.articles ?? []) {
                        if (a.url && a.title && !a.url.includes("[Removed]") && !seen.has(a.url)) {
                            seen.add(a.url);
                            discovered.push({
                                url: a.url,
                                title: a.title,
                                description: (a.description ?? "").slice(0, 300),
                                source: "newsapi",
                                publishedAt: a.publishedAt,
                            });
                            count++;
                        }
                    }
                    console.log(`[NewsAPI] ✅ ${count} articoli trovati`);
                } else {
                    console.warn(`[NewsAPI] ⚠️  HTTP ${res.status}`);
                }
            } catch (e) {
                console.error("[NewsAPI] ❌", e);
            }
        }
    } else if (sources.includes("newsapi") && !process.env.NEWSAPI_KEY) {
        console.log("[NewsAPI] ⏭️  NEWSAPI_KEY non impostata");
    }

    // ── 2. RSS ──────────────────────────────────────────────────────────────
    if (sources.includes("rss")) {
        const feedUrls = pickFeeds(interests, skills, role);
        console.log(`[RSS] 📡 ${feedUrls.length} feed selezionati per "${role}" / [${interests.join(", ")}]`);

        const feedResults = await Promise.allSettled(
            feedUrls.map((feedUrl) => {
                const domain = new URL(feedUrl).hostname.replace("www.", "");
                return fetch(feedUrl, { signal: AbortSignal.timeout(30_000) })
                    .then((r) => r.text())
                    .then((xml) => parseRssFeed(xml, domain));
            })
        );

        let rssTotal = 0;
        for (const result of feedResults) {
            if (result.status === "fulfilled") {
                for (const item of result.value) {
                    if (!seen.has(item.url)) {
                        seen.add(item.url);
                        discovered.push(item);
                        rssTotal++;
                    }
                }
            }
        }
        console.log(`[RSS] ✅ ${rssTotal} articoli dai feed`);
    }

    console.log(`[Discovery] 📋 Totale: ${discovered.length} articoli`);
    return discovered.slice(0, 40);
}

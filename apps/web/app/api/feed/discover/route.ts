import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/** Extended RSS feed catalog. Each key maps to topic keywords users might have. */
const RSS_CATALOG: Record<string, string[]> = {
    // Technology & Dev
    tech: ["https://feeds.feedburner.com/TechCrunch", "https://www.theverge.com/rss/index.xml", "https://techcrunch.com/feed/", "https://www.wired.com/feed/rss"],
    programming: ["https://www.smashingmagazine.com/feed/", "https://css-tricks.com/feed/", "https://dev.to/feed", "https://www.infoq.com/feed/"],
    javascript: ["https://javascriptweekly.com/rss/", "https://nodeweekly.com/rss/", "https://frontendfoc.us/rss/"],
    python: ["https://realpython.com/atom.xml", "https://pycoders.com/issues.rss", "https://pycoder.org/feed"],
    rust: ["https://this-week-in-rust.org/rss.xml", "https://blog.rust-lang.org/feed.xml"],
    golang: ["https://golangweekly.com/rss/"],
    typescript: ["https://javascriptweekly.com/rss/"],
    // AI & Machine Learning
    ai: ["https://www.marktechpost.com/feed/", "https://towardsdatascience.com/feed", "https://bair.berkeley.edu/blog/feed.xml", "https://openai.com/blog/rss/", "https://machinelearningmastery.com/feed/"],
    "machine learning": ["https://towardsdatascience.com/feed", "https://machinelearningmastery.com/feed/", "https://www.deeplearning.ai/the-batch/rss/"],
    llm: ["https://www.marktechpost.com/feed/", "https://www.deeplearning.ai/the-batch/rss/"],
    "data science": ["https://towardsdatascience.com/feed", "https://www.datascienceweekly.org/newsletters/rss.xml"],
    // Cloud & DevOps
    cloud: ["https://aws.amazon.com/blogs/aws/feed/", "https://cloud.google.com/feeds/gcp-blog-it.xml", "https://azure.microsoft.com/en-us/blog/feed/", "https://www.infoq.com/cloud-computing/rss/"],
    devops: ["https://devops.com/feed/", "https://www.devopsinstitute.com/feed/", "https://dzone.com/devops.rss"],
    kubernetes: ["https://kubernetes.io/feed.xml", "https://www.cncf.io/blog/feed/"],
    docker: ["https://www.docker.com/blog/feed/"],
    // Cybersecurity
    security: ["https://krebsonsecurity.com/feed/", "https://www.schneier.com/feed/atom/", "https://threatpost.com/feed/", "https://www.darkreading.com/rss.xml"],
    hacking: ["https://www.exploit-db.com/rss.xml", "https://krebsonsecurity.com/feed/"],
    // Startup & Business
    startup: ["https://feeds.feedburner.com/TechCrunch/startups", "https://sifted.eu/feed", "https://venturebeat.com/feed/", "https://news.ycombinator.com/rss"],
    "venture capital": ["https://venturebeat.com/feed/", "https://sifted.eu/feed"],
    // Finance & Crypto
    finance: ["https://www.bloomberg.com/feeds/technology.rss", "https://feeds.feedburner.com/entrepreneur/latest"],
    crypto: ["https://decrypt.co/feed", "https://cointelegraph.com/rss"],
    // Science
    science: ["https://www.sciencedaily.com/rss/all.xml", "https://www.nature.com/news.rss", "https://www.newscientist.com/feed/home/"],
    // Design & UX
    design: ["https://www.smashingmagazine.com/feed/", "https://alistapart.com/main/feed/", "https://uxdesign.cc/feed"],
    ux: ["https://uxdesign.cc/feed", "https://alistapart.com/main/feed/"],
    // Open Source
    "open source": ["https://opensource.com/feed", "https://www.linux.com/feed/"],
    linux: ["https://www.phoronix.com/rss.php", "https://www.linux.com/feed/"],
    // Product
    product: ["https://www.producthunt.com/feed", "https://www.mindtheproduct.com/feed/"],
    // General tech news (always included)
    _default: ["https://news.ycombinator.com/rss", "https://feeds.feedburner.com/TechCrunch"],
};

function pickFeeds(interests: string[], skills: string[], role: string): string[] {
    const tokens = [...interests, ...skills, role]
        .flatMap((s) => s.toLowerCase().split(/[\s,/]+/))
        .filter(Boolean);

    const chosen = new Set<string>(RSS_CATALOG._default);

    for (const [key, feeds] of Object.entries(RSS_CATALOG)) {
        if (key === "_default") continue;
        const keyWords = key.toLowerCase().split(/\s+/);
        const matches = tokens.some((t) =>
            keyWords.some((kw) => t.includes(kw) || kw.includes(t))
        );
        if (matches) feeds.forEach((f) => chosen.add(f));
    }
    return Array.from(chosen).slice(0, 10); // cap at 10 feeds
}

interface RawArticle {
    url: string;
    title: string;
    description: string;
    source: "newsapi" | "rss";
    publishedAt?: string;
}

function parseRssFeed(xml: string): RawArticle[] {
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
            items.push({ url: link.trim(), title, description: desc, source: "rss", publishedAt: pubDate });
        }
    }
    return items;
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { interests = [], skills = [], role = "", sources = ["newsapi", "rss"] } = body;

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
            feedUrls.map((feedUrl) =>
                fetch(feedUrl, { signal: AbortSignal.timeout(6000) })
                    .then((r) => r.text())
                    .then((xml) => parseRssFeed(xml))
            )
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
    return NextResponse.json({ articles: discovered.slice(0, 40) });
}

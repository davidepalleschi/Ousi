/** Extended RSS feed catalog. Each key maps to topic keywords users might have. */
export const RSS_CATALOG: Record<string, string[]> = {
    // Technology & Dev
    tech: ["https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pKVGlnQVAB?hl=it&gl=IT&ceid=IT:it", "https://feeds.feedburner.com/TechCrunch", "https://www.theverge.com/rss/index.xml"],
    programming: ["https://news.google.com/rss/search?q=programming+development&hl=it&gl=IT&ceid=IT:it", "https://dev.to/feed", "https://www.infoq.com/feed/"],
    javascript: ["https://news.google.com/rss/search?q=javascript&hl=it&gl=IT&ceid=IT:it", "https://javascriptweekly.com/rss/"],
    python: ["https://news.google.com/rss/search?q=python+programming&hl=it&gl=IT&ceid=IT:it", "https://realpython.com/atom.xml"],
    rust: ["https://news.google.com/rss/search?q=rust+lang&hl=it&gl=IT&ceid=IT:it", "https://this-week-in-rust.org/rss.xml"],
    golang: ["https://news.google.com/rss/search?q=golang&hl=it&gl=IT&ceid=IT:it", "https://golangweekly.com/rss/"],
    typescript: ["https://news.google.com/rss/search?q=typescript&hl=it&gl=IT&ceid=IT:it", "https://javascriptweekly.com/rss/"],
    // AI & Machine Learning
    ai: ["https://news.google.com/rss/search?q=intelligenza+artificiale+AI&hl=it&gl=IT&ceid=IT:it", "https://www.marktechpost.com/feed/", "https://towardsdatascience.com/feed"],
    "machine learning": ["https://news.google.com/rss/search?q=machine+learning&hl=it&gl=IT&ceid=IT:it", "https://towardsdatascience.com/feed"],
    llm: ["https://news.google.com/rss/search?q=LLM+large+language+models&hl=it&gl=IT&ceid=IT:it", "https://www.marktechpost.com/feed/"],
    "data science": ["https://news.google.com/rss/search?q=data+science&hl=it&gl=IT&ceid=IT:it", "https://towardsdatascience.com/feed"],
    // Cloud & DevOps
    cloud: ["https://news.google.com/rss/search?q=cloud+computing&hl=it&gl=IT&ceid=IT:it", "https://aws.amazon.com/blogs/aws/feed/", "https://cloud.google.com/feeds/gcp-blog-it.xml"],
    devops: ["https://news.google.com/rss/search?q=devops&hl=it&gl=IT&ceid=IT:it", "https://devops.com/feed/"],
    kubernetes: ["https://news.google.com/rss/search?q=kubernetes&hl=it&gl=IT&ceid=IT:it", "https://kubernetes.io/feed.xml"],
    docker: ["https://news.google.com/rss/search?q=docker&hl=it&gl=IT&ceid=IT:it", "https://www.docker.com/blog/feed/"],
    // Cybersecurity
    security: ["https://news.google.com/rss/search?q=cybersecurity+sicurezza+informatica&hl=it&gl=IT&ceid=IT:it", "https://krebsonsecurity.com/feed/"],
    hacking: ["https://news.google.com/rss/search?q=hacking+cybersecurity&hl=it&gl=IT&ceid=IT:it", "https://www.exploit-db.com/rss.xml"],
    // Startup & Business
    startup: ["https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pKVGlnQVAB/sections/CAQiSkNCQVNNUW9JTDIwdk1EWnVkR29TQldWdUxVZENHZ0pKVGlJT0NBUWFDZ29JTDIwdk1EZGiczkFxQ2dvSUVnWlVaVzV1YVhNb0FBKi4IACoqCAoiJENCQVNGUW9JTDIwdk1EWnVkR29TQldWdUxVZENHZ0pKVGlnQVABUAE?hl=it&gl=IT&ceid=IT:it", "https://sifted.eu/feed"],
    "venture capital": ["https://news.google.com/rss/search?q=venture+capital&hl=it&gl=IT&ceid=IT:it", "https://venturebeat.com/feed/"],
    // Finance & Crypto
    finance: ["https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pKVGlnQVAB/sections/CAQiR0NCQVNMd29JTDIwdk1EWnVkR29TQldWdUxVZENHZ0pKVGlnQ0NBUWFDZ29JTDIwdk1EZGxqQzhxQ2dvSUVnSmxiQ2dBKi4IACoqCAoiJENCQVNGUW9JTDIwdk1EWnVkR29TQldWdUxVZENHZ0pKVGlnQVABUAE?hl=it&gl=IT&ceid=IT:it", "https://www.bloomberg.com/feeds/technology.rss"],
    crypto: ["https://news.google.com/rss/search?q=criptovalute+crypto+bitcoin&hl=it&gl=IT&ceid=IT:it", "https://decrypt.co/feed"],
    // Science
    science: ["https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pKVGlnQVAB?hl=it&gl=IT&ceid=IT:it", "https://www.sciencedaily.com/rss/all.xml"],
    // Design & UX
    design: ["https://news.google.com/rss/search?q=web+design+ui&hl=it&gl=IT&ceid=IT:it", "https://www.smashingmagazine.com/feed/"],
    ux: ["https://news.google.com/rss/search?q=user+experience+ux&hl=it&gl=IT&ceid=IT:it", "https://uxdesign.cc/feed"],
    // Open Source
    "open source": ["https://news.google.com/rss/search?q=open+source&hl=it&gl=IT&ceid=IT:it", "https://opensource.com/feed"],
    linux: ["https://news.google.com/rss/search?q=linux&hl=it&gl=IT&ceid=IT:it", "https://www.phoronix.com/rss.php"],
    // Product
    product: ["https://news.google.com/rss/search?q=product+management&hl=it&gl=IT&ceid=IT:it", "https://www.producthunt.com/feed"],
    // General tech news (always included)
    _default: ["https://news.google.com/rss?hl=it&gl=IT&ceid=IT:it", "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pKVGlnQVAB?hl=it&gl=IT&ceid=IT:it"],
};

export function pickFeeds(interests: string[], skills: string[], role: string): string[] {
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

    // Add explicit Google News Search RSS feeds based on top tokens
    // We take a few top distinct tokens that are longer than 3 chars to form queries
    const searchTokens = Array.from(new Set(tokens.filter((t) => t.length > 3))).slice(0, 5);
    for (const token of searchTokens) {
        chosen.add(`https://news.google.com/rss/search?q=${encodeURIComponent(token)}&hl=it&gl=IT&ceid=IT:it`);
    }

    return Array.from(chosen).slice(0, 15); // increased cap to 15 to accommodate more google news feeds
}

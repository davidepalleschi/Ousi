import { NextRequest, NextResponse } from "next/server";
import { ProcessUrlInputSchema } from "@repo/shared";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
    // Auth check
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = ProcessUrlInputSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }

    const { url } = parsed.data;

    // ── 1. Extract content with Firecrawl ───────────────────────────────────
    const firecrawlRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, formats: ["markdown"] }),
    });

    if (!firecrawlRes.ok) {
        return NextResponse.json({ error: "Firecrawl extraction failed" }, { status: 502 });
    }

    const firecrawlData = await firecrawlRes.json();
    const markdown: string = firecrawlData?.data?.markdown ?? "";
    const title: string = firecrawlData?.data?.metadata?.title ?? url;

    if (!markdown) {
        return NextResponse.json({ error: "No content extracted" }, { status: 422 });
    }

    // ── 2. Fetch user identikit from profile ────────────────────────────────
    // (In a full implementation, fetch from DB. Here we accept it in the body too.)
    const userIdentikit = session.user && body.userIdentikit ? body.userIdentikit : null;

    // ── 3. Score and summarize with Deepseek ────────────────────────────────
    const systemPrompt = userIdentikit
        ? `You are a news relevance judge. The user profile is: 
Role: ${userIdentikit.role}
Skills: ${userIdentikit.skills?.join(", ")}
Interests: ${userIdentikit.interests?.join(", ")}
Topics to avoid: ${userIdentikit.avoidTopics?.join(", ")}

Tasks:
1. Score the article relevance from 1-10 based on the user profile.
2. Write a concise 3-sentence summary in Italian.

Respond ONLY with valid JSON: { "score": <number>, "summary": "<string>" }`
        : `Summarize this article in Italian in 3 sentences. Respond ONLY with valid JSON: { "score": 5, "summary": "<string>" }`;

    const deepseekRes = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: markdown.slice(0, 6000), // token limit guard
                },
            ],
            temperature: 0.3,
            max_tokens: 512,
        }),
    });

    if (!deepseekRes.ok) {
        return NextResponse.json({ error: "Deepseek analysis failed" }, { status: 502 });
    }

    const deepseekData = await deepseekRes.json();
    const rawContent = deepseekData.choices?.[0]?.message?.content ?? "{}";

    let score = 5;
    let summary = "";
    try {
        const parsed = JSON.parse(rawContent);
        score = typeof parsed.score === "number" ? parsed.score : 5;
        summary = typeof parsed.summary === "string" ? parsed.summary : rawContent;
    } catch {
        summary = rawContent;
    }

    return NextResponse.json({ url, title, relevanceScore: score, summary });
}

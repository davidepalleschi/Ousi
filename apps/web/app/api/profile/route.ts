import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { UserIdentikitSchema } from "@repo/shared";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const identikitParsed = UserIdentikitSchema.safeParse(body.userIdentikit);
    if (!identikitParsed.success) {
        return NextResponse.json({ error: identikitParsed.error.issues }, { status: 400 });
    }

    const identikitData = identikitParsed.data as any; // Cast to any or Record<string,any> to avoid TS errors on aiProfile

    if (!identikitData.aiProfile) {
        try {
            const prompt = `Sei un esperto curatore di profili personali per un'app di notizie selezionata dall'IA.
Crea un profilo discorsivo, elegante e in prima persona (circa 3-4 frasi) per un utente con le seguenti caratteristiche:
- Ruolo: ${identikitData.role}
- Competenze: ${(identikitData.skills ?? []).join(", ")}
- Interessi: ${(identikitData.interests ?? []).join(", ")}
- Da evitare: ${(identikitData.avoidTopics ?? []).join(", ")}

Il profilo deve descrivere chi è l'utente e il tipo di articoli e notizie in cui vuole immergersi quotidianamente. Non usare saluti banali ("Ciao, sono..."), inizia direttamente immergendoti nel profilo. Usa un tono professionale, intellettuale, curioso ma snello.`;

            const res = await fetch("https://api.deepseek.com/chat/completions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7,
                    max_tokens: 300,
                }),
                signal: AbortSignal.timeout(30_000),
            });

            if (res.ok) {
                const data = await res.json();
                const generated = data.choices?.[0]?.message?.content?.trim();
                if (generated) {
                    identikitData.aiProfile = generated;
                }
            }
        } catch (error) {
            console.error("[Profile API] Error generating aiProfile:", error);
        }
    }

    const profile = await prisma.profile.upsert({
        where: { userId: session.user.id },
        update: {
            userIdentikit: identikitData,
            newsletterFrequency: body.newsletterFrequency ?? "daily",
        },
        create: {
            userId: session.user.id,
            userIdentikit: identikitData,
            newsletterFrequency: body.newsletterFrequency ?? "daily",
        },
    });

    return NextResponse.json({ success: true, profile });
}

export async function GET(_req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
    return NextResponse.json({ profile });
}

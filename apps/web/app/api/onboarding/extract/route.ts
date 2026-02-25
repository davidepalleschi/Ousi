import { generateObject } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const profileSchema = z.object({
    role: z.string().describe("Il ruolo professionale o la qualifica principale dell'utente."),
    skills: z.array(z.string()).describe("Lista di competenze tecniche, argomenti specifici o tecnologie di interesse."),
    interests: z.array(z.string()).describe("Macro-aree di interesse dell'utente (es. Tecnologia, Economia, Arte, ecc.)."),
    avoidTopics: z.array(z.string()).describe("Argomenti che l'utente vuole escludere dalle notizie."),
});

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { messages } = await req.json();

        // Ensure we only pass standard messages to deepseek
        const formattedMessages = messages.map((m: any) => ({
            role: m.role,
            content: m.parts ? m.parts.map((p: any) => p.text).join(" ") : "",
        }));

        const { object } = await generateObject({
            model: deepseek("deepseek-chat"),
            schema: profileSchema,
            messages: [
                {
                    role: "system",
                    content: "Sei un estrattore di dati. Analizza la conversazione qui di seguito e compila il JSON del profilo utente.",
                },
                ...formattedMessages,
            ],
        });

        const identikit = {
            role: object.role || "Utente",
            skills: object.skills || [],
            interests: object.interests || [],
            avoidTopics: object.avoidTopics || [],
            createdAt: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, profile: identikit });

    } catch (error) {
        console.error("Error extracting profile:", error);
        return NextResponse.json({ error: "Failed to extract profile" }, { status: 500 });
    }
}

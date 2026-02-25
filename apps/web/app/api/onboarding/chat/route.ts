import { streamText } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { messages } = await req.json();

    const systemPrompt = `
    Sei Ousi, l'assistente IA personale dell'utente. Il tuo compito è aiutarlo a configurare il suo profilo per potergli consigliare le notizie migliori.
    
    Devi fargli qualche domanda, una alla volta, in modo conversazionale e amichevole.
    Gli obiettivi sono raccogliere:
    1. Il suo ruolo professionale o la sua descrizione personale.
    2. I suoi interessi principali e macro-aree (es. Tecnologia, Scienza, Economia, Arte, ecc).
    3. Sotto-argomenti o competenze specifiche che vuole approfondire.
    4. Quali argomenti preferisce EVITARE (opzionale, es. no politica, no calcio).

    NON fare tutte le domande in una volta. Inizia presentandoti brevemente e chiedendogli di cosa si occupa.
    Aspetta la sua risposta. In base alla risposta fai la domanda successiva.
    Una volta che pensi di avere un'idea chiara del suo profilo, digli che hai tutto ciò che ti serve e che può cliccare sul pulsante "Crea Profilo".
    Se l'utente vuole concludere prima, digli che va bene e di cliccare "Crea Profilo".
    Rispondi SEMPRE in Italiano, in modo conciso ma accogliente.
    `.trim();

    const formattedMessages = messages.map((m: any) => ({
        role: m.role,
        content: m.parts ? m.parts.map((p: any) => p.text).join(" ") : "",
    }));

    const result = streamText({
        model: deepseek("deepseek-chat"),
        system: systemPrompt,
        messages: formattedMessages,
    });

    return result.toUIMessageStreamResponse();
}

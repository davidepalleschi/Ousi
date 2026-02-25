import { generateObject } from "ai";
import { deepseek } from "@ai-sdk/deepseek";
import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const profileSchema = z.object({
    role: z.string().describe("Il ruolo professionale o la qualifica principale dell'utente."),
    skills: z.array(z.string()).describe("Lista di competenze tecniche, argomenti specifici o tecnologie di interesse."),
    interests: z.array(z.string()).describe("Macro-aree di interesse dell'utente (es. Tecnologia, Economia, Arte, ecc.)."),
    avoidTopics: z.array(z.string()).describe("Argomenti che l'utente vuole escludere dalle notizie."),
});

async function main() {
    const messages = [
        { role: "assistant", content: "Ciao! Sono Ousi, la tua IA personale. Per poterti consigliare le notizie migliori, vorrei conoscerti un po'. Di cosa ti occupi?" },
        { role: "user", content: "Sono uno sviluppatore software specializzato in intelligenza artificiale." },
        { role: "assistant", content: "Interessante! Oltre alla programmazione, hai altre passioni?" },
        { role: "user", content: "Sì, mi piace la geopolitica, ma non voglio leggere nulla di calcio o gossip." }
    ] as any;

    console.log("Extracting profile...");

    const { object } = await generateObject({
        model: deepseek("deepseek-chat"),
        schema: profileSchema,
        messages: [
            {
                role: "system",
                content: "Sei un estrattore di dati. Analizza la conversazione qui di seguito e compila il JSON del profilo utente.",
            },
            ...messages,
        ],
    });

    console.log("Extracted Profile:", JSON.stringify(object, null, 2));
}

main().catch(console.error);

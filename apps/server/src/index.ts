import Fastify from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";

const server = Fastify({ logger: true });

server.register(cors, {
    origin: ["http://localhost:3000", "https://ousi.palleschi.dev"],
    credentials: true,
});

const ExampleSchema = z.object({ message: z.string() });

server.get("/", async (request, reply) => {
    const parsed = ExampleSchema.safeParse({ message: "Hello from Fastify API" });
    return { status: "ok", sharedTypeCheck: parsed.success };
});

const start = async () => {
    try {
        await server.listen({ port: 3001, host: '0.0.0.0' });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
start();

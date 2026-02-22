import Fastify from "fastify";
import { ExampleSchema } from "@repo/shared";

const server = Fastify({ logger: true });

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

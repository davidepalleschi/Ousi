import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

// PrismaClient singleton to avoid too many DB connections in dev
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const auth = betterAuth({
    appName: "Ousi",
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
    },
    // trustedOrigins accepts any localhost port in dev
    trustedOrigins: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    advanced: {
        useSecureCookies: process.env.NODE_ENV === "production",
        generateId: () => crypto.randomUUID(),
    },
});

export type Session = typeof auth.$Infer.Session;

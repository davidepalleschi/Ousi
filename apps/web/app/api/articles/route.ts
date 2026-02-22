import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// GET /api/articles — fetch all articles for current user
export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const articles = await prisma.scoredArticle.findMany({
        where: { userId: session.user.id },
        orderBy: { relevanceScore: "desc" },
        take: 50,
    });
    return NextResponse.json({ articles });
}

// DELETE /api/articles — clear all articles for current user
export async function DELETE(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { count } = await prisma.scoredArticle.deleteMany({
        where: { userId: session.user.id },
    });
    return NextResponse.json({ deleted: count });
}

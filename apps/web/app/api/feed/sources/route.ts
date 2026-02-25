import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";
import { pickFeeds } from "../utils";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function GET(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
    const identikit = profile?.userIdentikit as any;

    if (!identikit) return NextResponse.json({ sources: [] });

    const feeds = pickFeeds(identikit.interests || [], identikit.skills || [], identikit.role || "");
    return NextResponse.json({ sources: feeds });
}

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

    const profile = await prisma.profile.upsert({
        where: { userId: session.user.id },
        update: {
            userIdentikit: identikitParsed.data,
            newsletterFrequency: body.newsletterFrequency ?? "daily",
        },
        create: {
            userId: session.user.id,
            userIdentikit: identikitParsed.data,
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

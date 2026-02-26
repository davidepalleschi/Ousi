import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { discoverArticles } from "../discoverService";

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { interests = [], skills = [], role = "", sources = ["newsapi", "rss"] } = body;

    const discovered = await discoverArticles(interests, skills, role, sources);
    return NextResponse.json({ articles: discovered });
}

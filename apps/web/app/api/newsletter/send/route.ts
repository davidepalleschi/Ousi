import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function buildNewsletterHtml(
    userName: string,
    date: string,
    articles: Array<{ title: string; url: string; summary: string; relevanceScore: number }>
): string {
    const articleRows = articles
        .map(
            (a, i) => `
      <tr>
        <td style="padding: 28px 0; border-bottom: 1px solid #3a2b1a;">
          <span style="color:#A6926D;font-size:10px;letter-spacing:0.25em;font-family:monospace;">
            ${String(i + 1).padStart(2, "0")} — RILEVANZA ${a.relevanceScore}/10
          </span><br/>
          <a href="${a.url}" style="color:#D9D4C7;font-size:18px;font-weight:500;text-decoration:none;line-height:1.4;">
            ${a.title}
          </a><br/>
          <p style="color:#BFB8AA;font-size:13px;line-height:1.8;margin:10px 0 0 0;">${a.summary}</p>
          <a href="${a.url}" style="color:#A6926D;font-size:11px;letter-spacing:0.15em;text-decoration:none;">LEGGI ARTICOLO →</a>
        </td>
      </tr>`
        )
        .join("");

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><title>Ousi — La tua newsletter</title></head>
<body style="background:#261807;margin:0;padding:48px 24px;font-family:Georgia,serif;">
  <table width="560" align="center" cellpadding="0" cellspacing="0">
    <tbody>
      <tr>
        <td style="text-align:center;padding-bottom:40px;border-bottom:1px solid #735F3C;">
          <span style="color:#D9D4C7;font-size:28px;font-weight:300;letter-spacing:0.3em;">OUSI</span><br/>
          <span style="color:#BFB8AA;font-size:11px;letter-spacing:0.2em;">${date}</span>
        </td>
      </tr>
      <tr>
        <td style="padding-top:36px;padding-bottom:24px;">
          <p style="color:#BFB8AA;font-size:14px;margin:0;line-height:1.8;">
            Ciao <strong style="color:#D9D4C7;">${userName}</strong>,<br/>
            ecco la tua selezione di oggi. ${articles.length} articoli curati per te.
          </p>
        </td>
      </tr>
      ${articleRows}
      <tr>
        <td style="padding-top:40px;text-align:center;">
          <p style="color:#735F3C;font-size:11px;line-height:1.8;margin:0;">
            Hai ricevuto questa email perché sei iscritto a Ousi.
          </p>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { articles, userName } = body;

    const html = buildNewsletterHtml(
        userName ?? session.user.name ?? "Utente",
        new Date().toLocaleDateString("it-IT", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        }),
        articles
    );

    const { error } = await resend.emails.send({
        from: "Ousi <newsletter@ousi.app>",
        to: [session.user.email],
        subject: `Ousi — La tua selezione del ${new Date().toLocaleDateString("it-IT")}`,
        html,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

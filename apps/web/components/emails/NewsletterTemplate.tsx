import * as React from "react";

export interface NewsletterArticle {
    title: string;
    url: string;
    summary: string;
    relevanceScore: number;
}

export interface NewsletterTemplateProps {
    userName: string;
    date: string;
    articles: NewsletterArticle[];
}

export function NewsletterTemplate({ userName, date, articles }: NewsletterTemplateProps) {
    return (
        <html>
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Ousi — La tua newsletter</title>
            </head>
            <body style={{ backgroundColor: "#261807", margin: 0, padding: 0, fontFamily: "'Georgia', serif" }}>
                <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: "#261807" }}>
                    <tbody>
                        <tr>
                            <td align="center" style={{ padding: "48px 24px" }}>
                                <table width="560" cellPadding={0} cellSpacing={0}>
                                    <tbody>
                                        {/* Header */}
                                        <tr>
                                            <td style={{ textAlign: "center", paddingBottom: "40px", borderBottom: "1px solid #735F3C" }}>
                                                <span
                                                    style={{
                                                        color: "#D9D4C7",
                                                        fontSize: "28px",
                                                        fontWeight: 300,
                                                        letterSpacing: "0.3em",
                                                        fontFamily: "'Georgia', serif",
                                                    }}
                                                >
                                                    OUSI
                                                </span>
                                                <br />
                                                <span style={{ color: "#BFB8AA", fontSize: "11px", letterSpacing: "0.2em", marginTop: "8px", display: "block" }}>
                                                    {date}
                                                </span>
                                            </td>
                                        </tr>

                                        {/* Greeting */}
                                        <tr>
                                            <td style={{ paddingTop: "36px", paddingBottom: "24px" }}>
                                                <p style={{ color: "#BFB8AA", fontSize: "14px", margin: 0, lineHeight: 1.8 }}>
                                                    Ciao <strong style={{ color: "#D9D4C7" }}>{userName}</strong>,<br />
                                                    ecco la tua selezione di oggi. {articles.length} articoli curati per te.
                                                </p>
                                            </td>
                                        </tr>

                                        {/* Divider */}
                                        <tr>
                                            <td style={{ height: "1px", backgroundColor: "#735F3C", marginBottom: "32px" }} />
                                        </tr>

                                        {/* Articles */}
                                        {articles.map((article, index) => (
                                            <tr key={article.url}>
                                                <td style={{ paddingTop: "28px", paddingBottom: "28px", borderBottom: "1px solid #3a2b1a" }}>
                                                    <table width="100%" cellPadding={0} cellSpacing={0}>
                                                        <tbody>
                                                            <tr>
                                                                <td>
                                                                    <span style={{ color: "#A6926D", fontSize: "10px", letterSpacing: "0.25em", fontFamily: "monospace" }}>
                                                                        {String(index + 1).padStart(2, "0")} — RILEVANZA {article.relevanceScore}/10
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ paddingTop: "8px" }}>
                                                                    <a
                                                                        href={article.url}
                                                                        style={{
                                                                            color: "#D9D4C7",
                                                                            fontSize: "18px",
                                                                            fontWeight: 500,
                                                                            textDecoration: "none",
                                                                            lineHeight: 1.4,
                                                                            fontFamily: "'Georgia', serif",
                                                                        }}
                                                                    >
                                                                        {article.title}
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ paddingTop: "10px" }}>
                                                                    <p style={{ color: "#BFB8AA", fontSize: "13px", lineHeight: 1.8, margin: 0 }}>
                                                                        {article.summary}
                                                                    </p>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ paddingTop: "12px" }}>
                                                                    <a
                                                                        href={article.url}
                                                                        style={{ color: "#A6926D", fontSize: "11px", letterSpacing: "0.15em", textDecoration: "none" }}
                                                                    >
                                                                        LEGGI ARTICOLO →
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Footer */}
                                        <tr>
                                            <td style={{ paddingTop: "40px", textAlign: "center" }}>
                                                <p style={{ color: "#735F3C", fontSize: "11px", lineHeight: 1.8, margin: 0 }}>
                                                    Hai ricevuto questa email perché sei iscritto a Ousi.<br />
                                                    <a href="#" style={{ color: "#A6926D", textDecoration: "none" }}>Annulla iscrizione</a>
                                                    {" · "}
                                                    <a href="#" style={{ color: "#A6926D", textDecoration: "none" }}>Gestisci preferenze</a>
                                                </p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </body>
        </html>
    );
}

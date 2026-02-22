"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { OusiLogo } from "@/components/OusiLogo";

interface Article {
    id: string;
    url: string;
    title: string;
    description?: string | null;
    summary: string;
    rawContent?: string | null;
    personalizedContent?: string | null;
    relevanceScore: number;
    source: string;
    publishedAt?: string | null;
}

function ScoreBadge({ score }: { score: number }) {
    const color = score >= 8 ? "#A6926D" : score >= 6 ? "#BFB8AA" : "#735F3C";
    return (
        <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5"
            style={{ color, border: `1px solid ${color}44` }}>
            {score}/10
        </span>
    );
}

const proseComponents = {
    h1: ({ children }: any) => <h1 className="text-xl font-light mt-6 mb-2" style={{ color: "var(--fg)" }}>{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg font-light mt-5 mb-1.5 text-ousi-tan">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-base font-medium mt-4 mb-1 text-ousi-brown">{children}</h3>,
    strong: ({ children }: any) => <strong className="text-ousi-brown font-medium">{children}</strong>,
    p: ({ children }: any) => <p className="mb-4 leading-7 text-sm">{children}</p>,
    li: ({ children }: any) => <li className="ml-4 list-disc mb-1 text-sm leading-relaxed">{children}</li>,
    ul: ({ children }: any) => <ul className="my-3 space-y-0.5">{children}</ul>,
    ol: ({ children }: any) => <ol className="my-3 space-y-0.5">{children}</ol>,
    blockquote: ({ children }: any) => (
        <blockquote className="border-l-2 border-ousi-tan pl-4 my-4 italic text-ousi-stone">{children}</blockquote>
    ),
    a: ({ href, children }: any) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-ousi-tan underline underline-offset-2 hover:text-ousi-brown">{children}</a>
    ),
    code: ({ children }: any) => (
        <code className="text-xs bg-ousi-stone/10 px-1.5 py-0.5 text-ousi-brown font-mono">{children}</code>
    ),
    pre: ({ children }: any) => (
        <pre className="text-xs bg-ousi-stone/10 p-4 my-4 overflow-x-auto text-ousi-stone font-mono">{children}</pre>
    ),
};

export default function ArticleReaderPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/articles/${id}`)
            .then((r) => r.json())
            .then((d) => { setArticle(d.article ?? null); setLoading(false); });
    }, [id]);

    const content = article?.rawContent || article?.personalizedContent;
    const hasContent = !!content;

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-ousi-tan animate-ping" />
        </div>
    );

    if (!article) return (
        <div className="flex min-h-screen items-center justify-center">
            <p className="text-ousi-stone text-sm">Articolo non trovato.</p>
        </div>
    );

    const publishedDate = article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })
        : null;

    return (
        <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
            {/* Top bar */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center justify-between mb-10">
                <button onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-2.5 text-ousi-stone text-xs tracking-widest hover:text-ousi-tan transition-colors">
                    <OusiLogo size={16} color="currentColor" />
                    ← FEED
                </button>
                <div className="flex items-center gap-4">
                    {article.personalizedContent && (
                        <button onClick={() => router.push(`/article/${id}/personalized`)}
                            className="text-ousi-tan text-[10px] tracking-widest border border-ousi-tan/40 px-3 py-1 hover:bg-ousi-tan hover:text-ousi-dark transition-all">
                            ✦ VERSIONE PERSONALIZZATA
                        </button>
                    )}
                    <a href={article.url} target="_blank" rel="noopener noreferrer"
                        className="text-ousi-stone text-[10px] tracking-widest hover:text-ousi-brown transition-colors">
                        ORIGINALE ↗
                    </a>
                </div>
            </motion.div>

            {/* Article header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-3">
                <div className="flex items-center gap-3">
                    <ScoreBadge score={article.relevanceScore} />
                    <span className="text-[10px] tracking-widest text-ousi-stone/60 uppercase">{article.source}</span>
                    {publishedDate && (
                        <span className="text-[10px] tracking-widest text-ousi-stone/40">{publishedDate}</span>
                    )}
                </div>
                <h1 className="text-2xl font-light leading-snug" style={{ color: "var(--fg)" }}>{article.title}</h1>
                {article.description && (
                    <p className="text-sm text-ousi-stone leading-relaxed border-l-2 border-ousi-stone/30 pl-3">
                        {article.description}
                    </p>
                )}
            </motion.div>

            {/* Content */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                {/* Summary box — always shown if present */}
                {article.summary && (
                    <div className="mb-8 border-l-2 border-ousi-tan pl-5 space-y-2" style={{ background: "transparent" }}>
                        <p className="text-[10px] tracking-widest text-ousi-tan font-medium">RIEPILOGO DELL'ARTICOLO</p>
                        <p className="text-sm leading-7" style={{ color: "var(--fg)" }}>{article.summary}</p>
                    </div>
                )}

                {hasContent ? (
                    <>
                        <div className="h-px mb-8" style={{ background: "var(--border)" }} />
                        <div style={{ color: "var(--fg)" }}>
                            <ReactMarkdown components={proseComponents}>{content!}</ReactMarkdown>
                        </div>
                    </>
                ) : (
                    <div className="border border-ousi-stone/20 p-5 space-y-3 mt-4" style={{ background: "var(--bg-surface)" }}>
                        <p className="text-ousi-stone text-xs">
                            Questo articolo è stato classificato ma non ancora letto in profondità.
                            Puoi leggere l'originale completo:
                        </p>
                        <a href={article.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-xs tracking-widest text-ousi-tan hover:text-ousi-brown transition-colors">
                            APRI ARTICOLO ORIGINALE ↗
                        </a>
                    </div>
                )}
            </motion.div>

            {/* Bottom nav */}
            <div className="mt-12 pt-6 flex items-center justify-between border-t" style={{ borderColor: "var(--border)" }}>
                <button onClick={() => router.push("/dashboard")}
                    className="text-ousi-stone text-xs tracking-widest hover:text-ousi-tan transition-colors">
                    ← TORNA AL FEED
                </button>
                <a href={article.url} target="_blank" rel="noopener noreferrer"
                    className="text-ousi-stone/50 text-[10px] tracking-widest hover:text-ousi-stone transition-colors">
                    FONTE ORIGINALE ↗
                </a>
            </div>
        </main>
    );
}

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
    translatedTitle?: string | null;
    tags?: string[];
    personalizedContent?: string | null;
    relevanceScore: number;
    source: string;
    publishedAt?: string | null;
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
};

export default function PersonalizedArticlePage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/articles/${id}`)
            .then((r) => r.json())
            .then((d) => { setArticle(d.article ?? null); setLoading(false); });
    }, [id]);

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-ousi-tan animate-ping" />
        </div>
    );

    if (!article || !article.personalizedContent) return (
        <div className="flex min-h-screen items-center justify-center flex-col gap-4">
            <p className="text-ousi-stone text-sm">Versione personalizzata non disponibile.</p>
            <button onClick={() => router.push(`/article/${id}`)}
                className="text-ousi-tan text-xs tracking-widest px-4 py-2 rounded-full hover:bg-ousi-stone/10 hover:text-ousi-brown transition-colors">
                ← LEGGI ARTICOLO
            </button>
        </div>
    );

    return (
        <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
            {/* Top bar */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center justify-between mb-10">
                <button onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-full text-ousi-stone text-xs tracking-widest hover:bg-ousi-stone/10 hover:text-ousi-tan transition-colors">
                    <OusiLogo size={16} color="currentColor" />
                    ← FEED
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={() => router.push(`/article/${id}`)}
                        className="text-ousi-stone text-[10px] tracking-widest px-3 py-1.5 rounded-full hover:bg-ousi-stone/10 hover:text-ousi-brown transition-colors">
                        VERSIONE STANDARD
                    </button>
                    <a href={article.url} target="_blank" rel="noopener noreferrer"
                        className="text-ousi-stone text-[10px] tracking-widest px-3 py-1.5 rounded-full hover:bg-ousi-stone/10 hover:text-ousi-brown transition-colors">
                        ORIGINALE ↗
                    </a>
                </div>
            </motion.div>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 space-y-3">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] tracking-widest text-ousi-tan border border-ousi-tan/40 px-2 py-0.5 rounded-md">
                        ✦ CURATO PER TE
                    </span>
                    <span className="text-[10px] tracking-widest text-ousi-stone/60 uppercase">{article.source}</span>
                </div>
                <h1 className="text-2xl font-light leading-snug" style={{ color: "var(--fg)" }}>{article.translatedTitle || article.title}</h1>

                {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1 pb-2">
                        {article.tags.map(tag => (
                            <span key={tag} className="text-[10px] tracking-wider text-ousi-tan/80 bg-ousi-tan/10 px-2 py-0.5 rounded border border-ousi-tan/20">
                                {tag.toUpperCase()}
                            </span>
                        ))}
                    </div>
                )}
                <p className="text-xs text-ousi-stone/50 tracking-wide">
                    Rielaborato e personalizzato da Ousi in base al tuo profilo
                </p>
            </motion.div>

            <div className="h-px mb-8" style={{ background: "var(--border)" }} />

            {/* Personalized content */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                style={{ color: "var(--fg)" }}>
                <div className="text-[15px] leading-relaxed tracking-wide prose-sm prose-p:mb-4 prose-li:mb-2">
                    <ReactMarkdown components={proseComponents}>{article.personalizedContent}</ReactMarkdown>
                </div>
            </motion.div>

            {/* Bottom nav */}
            <div className="mt-12 pt-6 flex items-center justify-between border-t" style={{ borderColor: "var(--border)" }}>
                <button onClick={() => router.push("/dashboard")}
                    className="text-ousi-stone text-xs tracking-widest px-4 py-2 rounded-full hover:bg-ousi-stone/10 hover:text-ousi-tan transition-colors">
                    ← TORNA AL FEED
                </button>
                <a href={article.url} target="_blank" rel="noopener noreferrer"
                    className="text-ousi-stone/50 text-[10px] tracking-widest px-4 py-2 rounded-full hover:bg-ousi-stone/10 hover:text-ousi-stone transition-colors">
                    FONTE ORIGINALE ↗
                </a>
            </div>
        </main>
    );
}

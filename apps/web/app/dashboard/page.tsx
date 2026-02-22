"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { OusiLogo } from "@/components/OusiLogo";

interface Article {
    id: string;
    url: string;
    title: string;
    description?: string | null;
    summary: string;
    personalizedContent?: string | null;
    relevanceScore: number;
    source: string;
    publishedAt?: string | null;
    createdAt: string;
}

function ScoreBadge({ score }: { score: number }) {
    const color =
        score >= 8 ? "#A6926D" : score >= 6 ? "#BFB8AA" : "#735F3C";
    return (
        <span
            className="inline-flex items-center text-[10px] font-mono tracking-widest px-1.5 py-0.5"
            style={{ color, border: `1px solid ${color}33` }}
        >
            {score}/10
        </span>
    );
}

function ArticleCard({ article }: { article: Article }) {
    const router = useRouter();
    const hasDeep = !!article.personalizedContent;

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-ousi-stone/20 hover:border-ousi-stone/40 transition-colors cursor-pointer"
            style={{ background: "var(--bg-surface)" }}
            onClick={() => router.push(article.personalizedContent ? `/article/${article.id}/personalized` : `/article/${article.id}`)}
        >
            <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <ScoreBadge score={article.relevanceScore} />
                            {hasDeep && (
                                <span className="text-[10px] tracking-widest text-ousi-tan border border-ousi-tan/40 px-1.5 py-0.5">
                                    ✦ CURATO
                                </span>
                            )}
                            <span className="text-[10px] tracking-widest text-ousi-stone/60 uppercase">{article.source}</span>
                        </div>
                        <p
                            className="text-sm font-medium leading-snug line-clamp-2"
                            style={{ color: "var(--fg)" }}
                        >
                            {article.title}
                        </p>
                    </div>
                    <span className="shrink-0 text-[10px] tracking-widest text-ousi-stone group-hover:text-ousi-tan transition-colors mt-1">
                        LEGGI →
                    </span>
                </div>

                <p className="text-xs leading-relaxed text-ousi-stone/80 line-clamp-2">{article.summary}</p>

                {hasDeep && (
                    <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/article/${article.id}/personalized`); }}
                        className="text-[10px] tracking-widest text-ousi-tan hover:text-ousi-brown transition-colors"
                    >
                        ✦ VERSIONE PERSONALIZZATA →
                    </button>
                )}
            </div>
        </motion.article>
    );
}


export default function DashboardPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [articles, setArticles] = useState<Article[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingArticles, setLoadingArticles] = useState(true);
    const [error, setError] = useState("");
    const [processedCount, setProcessedCount] = useState<number | null>(null);
    const [progressLog, setProgressLog] = useState<Array<{ icon: string; message: string; score?: number }>>([]);
    const [clearing, setClearing] = useState(false);

    useEffect(() => {
        if (!isPending && !session) router.push("/auth/login");
    }, [session, isPending]);

    useEffect(() => {
        if (!session) return;
        fetch("/api/profile").then((r) => r.json()).then((d) => setProfile(d.profile));
        fetch("/api/articles").then((r) => r.json()).then((d) => {
            setArticles(d.articles ?? []);
            setLoadingArticles(false);
        });
    }, [session]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        setError("");
        setProcessedCount(null);
        setProgressLog([]);
        try {
            const res = await fetch("/api/articles/refresh", { method: "POST" });
            if (!res.ok || !res.body) { setError("Errore di connessione."); return; }
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    try {
                        const event = JSON.parse(line.slice(6));
                        if (event.type === "article_ready") {
                            // Add article immediately, keep sorted by score
                            setArticles((prev) => {
                                const without = prev.filter((a) => a.id !== event.article.id);
                                return [...without, event.article].sort((a, b) => b.relevanceScore - a.relevanceScore);
                            });
                        } else if (event.type === "done") {
                            setProcessedCount(event.processed ?? 0);
                        } else if (event.type === "error") {
                            setError(event.message);
                        } else if (event.type === "status" || event.type === "article") {
                            setProgressLog((prev) => [
                                ...prev.slice(-60),
                                { icon: event.icon, message: event.message, score: event.score },
                            ]);
                        }
                    } catch { /* ignore */ }
                }
            }
        } catch {
            setError("Errore di rete. Riprova.");
        } finally {
            setRefreshing(false);
        }
    }, []);

    const handleClearArticles = useCallback(async () => {
        setClearing(true);
        try {
            const res = await fetch("/api/articles", { method: "DELETE" });
            const data = await res.json();
            console.log("[SVUOTA]", data);
            if (res.ok) {
                setArticles([]);
                setProcessedCount(null);
                setError("");
                setProgressLog([]);
            } else {
                setError(data.error ?? "Errore durante la cancellazione.");
            }
        } catch (e) {
            console.error("[SVUOTA] errore:", e);
            setError("Errore di rete durante la cancellazione.");
        } finally {
            setClearing(false);
        }
    }, []);

    if (isPending || !session) return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-ousi-tan animate-ping" />
        </div>
    );

    const hasProfile = !!profile?.userIdentikit;

    return (
        <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mb-10">
                <span className="flex items-center gap-2 tracking-[0.25em] text-sm font-light" style={{ color: "var(--fg)" }}>
                    <OusiLogo size={20} color="#A6926D" />
                    OUSI
                </span>
                <div className="flex items-center gap-5">
                    <a href="/onboarding" className="text-ousi-stone text-xs tracking-widest hover:text-ousi-brown transition-colors">
                        PROFILO
                    </a>
                    <button
                        onClick={() => signOut().then(() => router.push("/"))}
                        className="text-ousi-stone text-xs tracking-widest hover:text-ousi-brown transition-colors"
                    >
                        ESCI
                    </button>
                </div>
            </motion.div>

            {/* Greeting + Refresh */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between mb-8">
                <div>
                    <p className="text-ousi-tan text-[10px] tracking-widest mb-1">BENVENUTO</p>
                    <h1 className="text-xl font-light" style={{ color: "var(--fg)" }}>{session.user.name}</h1>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing || !hasProfile}
                    title={!hasProfile ? "Completa il profilo nell'onboarding prima di aggiornare" : ""}
                    className="flex items-center gap-2 px-5 py-2 bg-ousi-tan text-ousi-dark text-xs font-medium tracking-widest hover:bg-ousi-brown hover:text-ousi-cream disabled:opacity-40 transition-all duration-300"
                >
                    {refreshing ? (
                        <>
                            <span className="inline-block w-2 h-2 rounded-full bg-ousi-dark opacity-60 animate-ping" />
                            ANALISI IN CORSO…
                        </>
                    ) : "AGGIORNA FEED"}
                </button>
                {articles.length > 0 && !refreshing && (
                    <button
                        onClick={handleClearArticles}
                        disabled={clearing}
                        className="text-ousi-stone/50 text-[10px] tracking-widest hover:text-red-400 disabled:opacity-30 transition-colors px-2 py-1"
                        title="Elimina tutti gli articoli e ricrea il feed"
                    >
                        {clearing ? "…" : "↺ SVUOTA"}
                    </button>
                )}
            </motion.div>

            {/* Profile missing warning */}
            {!hasProfile && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 border border-ousi-tan/40 text-ousi-tan text-xs tracking-wide">
                    Completa il tuo{" "}
                    <a href="/onboarding" className="underline underline-offset-2 hover:text-ousi-brown transition-colors">
                        profilo nell'onboarding
                    </a>{" "}
                    per ricevere articoli curati.
                </motion.div>
            )}

            {/* Error / done message */}
            <AnimatePresence>
                {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-4 text-red-500 text-xs">
                        {error}
                    </motion.p>
                )}
                {processedCount !== null && !refreshing && (
                    <motion.p
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="mb-4 text-ousi-stone text-xs tracking-wide"
                    >
                        {processedCount === 0
                            ? "Feed già aggiornato — nessun nuovo articolo."
                            : `Analizzati ${processedCount} nuovi articoli.`}
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Articles section */}
            <section>
                {/* Inline progress header — visible during refresh above articles */}
                <AnimatePresence>
                    {refreshing && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="flex items-center gap-4 mb-6 pb-4 border-b"
                            style={{ borderColor: "var(--border)" }}
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                                className="shrink-0"
                            >
                                <OusiLogo size={22} color="#A6926D" />
                            </motion.div>
                            <div className="min-w-0 flex-1">
                                <p className="text-ousi-tan text-[10px] tracking-widest mb-0.5">
                                    ELABORAZIONE IN CORSO {articles.length > 0 && `— ${articles.length} pronti`}
                                </p>
                                <p className="text-ousi-stone text-xs truncate">
                                    {progressLog.length > 0
                                        ? `${progressLog[progressLog.length - 1].icon} ${progressLog[progressLog.length - 1].message}`
                                        : "Avvio…"}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {loadingArticles ? (
                    <div className="flex items-center gap-2 text-ousi-stone text-xs">
                        <div className="w-1 h-1 rounded-full bg-ousi-tan animate-ping" />
                        Caricamento…
                    </div>
                ) : articles.length === 0 ? (
                    refreshing ? (
                        /* Full-center spinner only when refreshing with zero articles yet */
                        <div className="flex flex-col items-center justify-center py-24 gap-5">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
                                <OusiLogo size={52} color="#A6926D" />
                            </motion.div>
                            <p className="text-ousi-stone/60 text-xs">Potrebbe richiedere qualche minuto…</p>
                        </div>
                    ) : (
                        <div className="py-12 text-center space-y-3">
                            <OusiLogo size={32} color="#BFB8AA" />
                            <p className="text-ousi-stone text-sm">
                                {hasProfile
                                    ? 'Nessun articolo ancora. Clicca "Aggiorna Feed" per iniziare.'
                                    : "Completa il profilo per ricevere i tuoi articoli."}
                            </p>
                        </div>
                    )
                ) : (
                    <>
                        {!refreshing && (
                            <p className="text-ousi-tan text-[10px] tracking-widest mb-4">
                                ARTICOLI CONSIGLIATI ({articles.length})
                            </p>
                        )}
                        <motion.div layout className="space-y-3">
                            <AnimatePresence>
                                {articles.map((article) => (
                                    <motion.div
                                        key={article.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        layout
                                    >
                                        <ArticleCard article={article} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </>
                )}
            </section>
        </main>
    );
}

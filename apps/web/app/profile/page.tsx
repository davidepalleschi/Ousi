"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OusiLogo } from "@/components/OusiLogo";

export default function ProfilePage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [aiProfileText, setAiProfileText] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/auth/login");
        }
    }, [session, isPending, router]);

    useEffect(() => {
        if (!session) return;
        fetch("/api/profile")
            .then((r) => r.json())
            .then((d) => {
                setProfile(d.profile);
                if (d.profile?.userIdentikit?.aiProfile) {
                    setAiProfileText(d.profile.userIdentikit.aiProfile);
                } else {
                    setAiProfileText("Nessun profilo generato dall'IA trovato. Ricollega i tuoi interessi o aggiorna il feed per generarne uno.");
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [session]);

    const handleSave = async () => {
        if (!profile) return;
        setSaving(true);
        setSaveSuccess(false);

        try {
            const updatedIdentikit = {
                ...profile.userIdentikit,
                aiProfile: aiProfileText
            };

            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userIdentikit: updatedIdentikit,
                    newsletterFrequency: profile.newsletterFrequency
                })
            });

            if (res.ok) {
                setSaveSuccess(true);
                setIsEditing(false);
                setTimeout(() => setSaveSuccess(false), 3000);
            }
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setSaving(false);
        }
    };

    if (isPending || !session) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-ousi-tan animate-ping" />
            </div>
        );
    }

    return (
        <main className="min-h-screen px-6 py-10 max-w-4xl mx-auto flex flex-col">
            {/* Header */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mb-10 shrink-0">
                <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-2 tracking-[0.25em] text-sm font-light hover:opacity-70 transition-opacity"
                    style={{ color: "var(--fg)" }}
                >
                    <OusiLogo size={20} color="#A6926D" />
                    OUSI
                </button>
                <div className="flex items-center gap-5">
                    <button onClick={() => router.push("/dashboard")} className="text-ousi-stone text-xs tracking-widest hover:text-ousi-brown transition-colors">
                        DASHBOARD
                    </button>
                    <button
                        onClick={() => signOut().then(() => router.push("/"))}
                        className="text-ousi-stone text-xs tracking-widest hover:text-ousi-brown transition-colors"
                    >
                        ESCI
                    </button>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-10 shrink-0">
                <p className="text-ousi-tan text-[10px] tracking-widest mb-1">IMPOSTAZIONI</p>
                <h1 className="text-xl font-light" style={{ color: "var(--fg)" }}>Il Tuo Profilo Curato</h1>
                <p className="text-xs text-ousi-stone mt-2 max-w-xl leading-relaxed">
                    Questo è il ritratto che l'Intelligenza Artificiale ha disegnato di te in base ai tuoi interessi.
                    Puoi modificarlo liberamente per far capire all'IA esattamente quali notizie vuoi leggere e con quale tono.
                </p>
            </motion.div>

            <div className="flex-1 flex flex-col min-h-0 relative">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="w-1.5 h-1.5 rounded-full bg-ousi-tan animate-ping" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex-1 flex flex-col bg-[var(--bg-surface)] border border-[var(--border)] p-6 shadow-sm relative"
                    >
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <h2 className="text-sm tracking-widest text-ousi-brown font-light">PROFILO NARRATIVO</h2>
                            <button
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                disabled={saving}
                                className={`text-[10px] tracking-widest px-3 py-1.5 transition-colors ${isEditing
                                        ? "bg-ousi-tan text-ousi-dark hover:bg-ousi-brown hover:text-ousi-cream"
                                        : "border border-ousi-stone/30 text-ousi-stone hover:border-ousi-tan hover:text-ousi-tan"
                                    }`}
                            >
                                {saving ? "SALVATAGGIO..." : isEditing ? "SALVA MODIFICHE" : "MODIFICA"}
                            </button>
                        </div>

                        <div className="flex-1 relative">
                            {isEditing ? (
                                <textarea
                                    value={aiProfileText}
                                    onChange={(e) => setAiProfileText(e.target.value)}
                                    className="w-full h-full min-h-[250px] p-4 bg-[var(--bg)] border border-ousi-tan/30 text-sm leading-relaxed focus:outline-none focus:border-ousi-tan transition-colors resize-none custom-scrollbar"
                                    style={{ color: "var(--fg)" }}
                                    placeholder="Scrivi qui il tuo profilo narrativo..."
                                />
                            ) : (
                                <div className="w-full h-full min-h-[250px] p-4 text-sm leading-relaxed overflow-y-auto custom-scrollbar italic tracking-wide" style={{ color: "var(--fg)" }}>
                                    "{aiProfileText}"
                                </div>
                            )}
                        </div>

                        <AnimatePresence>
                            {saveSuccess && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute bottom-6 right-6 bg-green-500/10 border border-green-500/20 text-green-600 px-3 py-1.5 text-[10px] tracking-widest"
                                >
                                    PROFILO AGGIORNATO
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-8 border-t border-[var(--border)] pt-8 flex justify-between items-center shrink-0">
                <button
                    onClick={() => router.push("/onboarding")}
                    className="text-ousi-stone text-xs tracking-widest hover:text-ousi-brown transition-colors"
                >
                    ↺ RIFAI IL QUESTIONARIO
                </button>
            </motion.div>
        </main>
    );
}

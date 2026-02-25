"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Transition } from "framer-motion";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { OusiLogo } from "@/components/OusiLogo";

// ── Universal role presets ───────────────────────────────────────────────────

const ROLE_PRESETS = [
    "Sviluppatore / Engineer", "Designer / Creativo", "Ricercatore / Accademico",
    "Medico / Sanitario", "Giornalista / Scrittore", "Manager / Dirigente",
    "Imprenditore / Founder", "Avvocato / Legale", "Finanza / Consulente",
    "Insegnante / Educatore", "Studente", "Artista / Musicista",
    "Marketing / Comunicazione", "Architetto / Ingegnere", "Altro",
];

// ── Macro-areas with icon + subcategories + chips ────────────────────────────

const MACRO_AREAS: Record<string, {
    icon: string;
    subs: Record<string, string[]>;
}> = {
    "Tecnologia": {
        icon: "💻",
        subs: {
            "Sviluppo software": ["JavaScript / Web", "Python", "Mobile", "Game Dev", "Open Source"],
            "AI & Dati": ["Intelligenza Artificiale", "Machine Learning", "Data Science", "LLM / GPT"],
            "Cloud & DevOps": ["AWS / GCP / Azure", "Kubernetes", "CI/CD", "Linux / Server"],
            "Sicurezza": ["Cybersecurity", "Privacy", "Hacking etico", "OSINT"],
            "Hardware & IoT": ["Elettronica", "Robotica", "Arduino / RaspberryPi", "Droni"],
        },
    },
    "Scienza": {
        icon: "🔬",
        subs: {
            "Scienze naturali": ["Fisica", "Chimica", "Biologia", "Astrofisica"],
            "Scienze della vita": ["Neuroscienze", "Genetica", "Medicina", "Psicologia"],
            "Clima & Ambiente": ["Cambiamenti climatici", "Energia rinnovabile", "Ecologia"],
            "Matematica": ["Statistica", "Crittografia", "Modellistica"],
        },
    },
    "Economia & Business": {
        icon: "📈",
        subs: {
            "Startup & Innovazione": ["Startup", "Venture Capital", "Product Management", "SaaS"],
            "Finanza": ["Mercati finanziari", "Investimenti", "Crypto", "Economia globale"],
            "Management": ["Leadership", "Strategy", "Operations", "HR & Lavoro"],
            "Marketing": ["Growth hacking", "Branding", "Social media", "SEO"],
        },
    },
    "Arte & Cultura": {
        icon: "🎨",
        subs: {
            "Arti visive": ["Design", "Fotografia", "Illustrazione", "Moda"],
            "Musica": ["Produzione musicale", "Critica musicale", "Strumenti", "Concerti"],
            "Letteratura": ["Narrativa", "Saggistica", "Poesia", "Editoria"],
            "Cinema & Serie": ["Film", "Serie TV", "Documentari", "Animazione"],
            "Architettura": ["Design urbano", "Interior design", "Patrimonio culturale"],
        },
    },
    "Salute & Benessere": {
        icon: "🧘",
        subs: {
            "Salute fisica": ["Nutrizione", "Sport & Fitness", "Medicina", "Prevenzione"],
            "Salute mentale": ["Psicologia", "Mindfulness", "Stress & Burnout", "Filosofia pratica"],
            "Ricerca medica": ["Farmacologia", "Biotech", "Longevità", "Neuroscienze"],
        },
    },
    "Sport": {
        icon: "⚽",
        subs: {
            "Sport di squadra": ["Calcio", "Basket", "Rugby", "Baseball"],
            "Sport individuali": ["Tennis", "Atletica", "Nuoto", "Ciclismo"],
            "Motorsport": ["Formula 1", "MotoGP", "Rally"],
            "Sport emergenti": ["Esports", "Sport estremi", "Padel", "Crossfit"],
        },
    },
    "Politica & Società": {
        icon: "🌍",
        subs: {
            "Politica": ["Politica italiana", "Politica internazionale", "Elezioni", "Geopolitica"],
            "Diritti & Legge": ["Diritti civili", "Privacy & Sorveglianza", "Diritto digitale"],
            "Società": ["Immigrazione", "Lavoro & Sindacato", "Disuguaglianze", "Istruzione"],
        },
    },
    "Filosofia & Idee": {
        icon: "📚",
        subs: {
            "Filosofia": ["Etica", "Filosofia della mente", "Epistemologia", "Storia della filosofia"],
            "Futurismo": ["Transumanesimo", "AI & umanità", "Post-capitalismo"],
            "Podcast & Libri": ["Saggi", "Biografie", "Self-improvement", "Storia"],
        },
    },
    "Viaggi & Lifestyle": {
        icon: "✈️",
        subs: {
            "Viaggi": ["Destinazioni", "Travel hacking", "Nomadismo digitale", "Avventura"],
            "Food": ["Gastronomia", "Ricette", "Ristoranti", "Cucina mondiale"],
            "Casa": ["Interior design", "Sostenibilità domestica", "Gardening"],
        },
    },
};

const AVOID_PRESETS = [
    "Politica", "Sport", "Gossip / Celebrity", "Crypto / NFT",
    "Finanza tradizionale", "Religione", "Pubblicità / Marketing",
    "Moda / Lifestyle", "Cucina / Food", "Gaming", "Viaggi",
];

// ── Utils ─────────────────────────────────────────────────────────────────────

function toggle(arr: string[], val: string): string[] {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

// ── UI Components ─────────────────────────────────────────────────────────────

function Chip({ label, selected, onClick, size = "md" }: {
    label: string; selected: boolean; onClick: () => void; size?: "sm" | "md" | "lg";
}) {
    const sizes = { sm: "px-2.5 py-1 text-[11px]", md: "px-3 py-1.5 text-xs", lg: "px-4 py-2 text-sm" };
    return (
        <motion.button
            type="button" layout whileTap={{ scale: 0.95 }} onClick={onClick}
            className={`${sizes[size]} tracking-wide border rounded-full transition-all duration-200 ${selected
                ? "bg-ousi-brown text-ousi-cream border-ousi-brown"
                : "border-ousi-stone/40 text-ousi-stone hover:border-ousi-tan hover:text-ousi-tan"
                }`}
            style={{ background: selected ? undefined : "var(--bg)" }}
        >
            {selected && "✓ "}{label}
        </motion.button>
    );
}

function MacroCard({ area, icon, selected, onClick }: {
    area: string; icon: string; selected: boolean; onClick: () => void;
}) {
    return (
        <motion.button
            type="button" layout whileTap={{ scale: 0.97 }} onClick={onClick}
            className={`flex items-center gap-2.5 px-4 py-3 border rounded-2xl text-sm transition-all duration-200 ${selected
                ? "border-ousi-tan bg-ousi-tan/10 text-ousi-tan"
                : "border-ousi-stone/30 hover:border-ousi-stone/60"
                }`}
            style={{ color: selected ? undefined : "var(--fg)", background: selected ? undefined : "var(--bg-surface)" }}
        >
            <span className="text-lg">{icon}</span>
            <span className="font-light tracking-wide">{area}</span>
        </motion.button>
    );
}

function SubCategoryGroup({ category, options, selected, onToggle }: {
    category: string; options: string[]; selected: string[]; onToggle: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const count = options.filter((o) => selected.includes(o)).length;
    return (
        <div className="border border-ousi-stone/15 rounded-2xl overflow-hidden" style={{ background: "var(--bg-surface)" }}>
            <button type="button" onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-ousi-stone/5 transition-colors"
            >
                <span className="text-xs tracking-widest" style={{ color: "var(--fg)" }}>{category}</span>
                <div className="flex items-center gap-2">
                    {count > 0 && <span className="text-[10px] bg-ousi-brown text-ousi-cream px-1.5 py-0.5 rounded-md">{count}</span>}
                    <span className="text-ousi-stone/60 text-xs">{open ? "▲" : "▼"}</span>
                </div>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2 border-t border-ousi-stone/10">
                            {options.map((opt) => (
                                <Chip key={opt} label={opt} size="sm" selected={selected.includes(opt)} onClick={() => onToggle(opt)} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const enterT: Transition = { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] };
const exitT: Transition = { duration: 0.2, ease: [0.4, 0, 1, 1] };
const slide = {
    initial: { opacity: 0, x: 32 },
    animate: { opacity: 1, x: 0, transition: enterT },
    exit: { opacity: 0, x: -32, transition: exitT },
};

import dynamic from "next/dynamic";

const STEPS = [
    { id: "role", label: "01 — RUOLO", question: "Come ti definiresti?" },
    { id: "macro", label: "02 — AREE", question: "Cosa vuoi leggere?" },
    { id: "sub", label: "03 — DETTAGLI", question: "Approfondisci le tue aree" },
    { id: "avoidTopics", label: "04 — FILTRI", question: "Cosa preferisci non leggere?" },
];

function OnboardingPageContent() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [customRole, setCustomRole] = useState("");
    const [selectedRole, setSelectedRole] = useState<string[]>([]);
    const [selectedMacro, setSelectedMacro] = useState<string[]>([]);
    const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
    const [avoidTopics, setAvoidTopics] = useState<string[]>([]);

    // AI Chat State
    const [isAiMode, setIsAiMode] = useState(true);
    const [extracting, setExtracting] = useState(false);
    const [input, setInput] = useState("");

    const { messages, status, sendMessage } = useChat({
        transport: new DefaultChatTransport({ api: "/api/onboarding/chat" }),
        messages: [
            {
                id: '1',
                role: 'assistant',
                parts: [{ type: 'text', text: 'Ciao! Sono Ousi, la tua IA personale. Per poterti consigliare le notizie migliori, vorrei conoscerti un po\'. Di cosa ti occupi?' }]
            }
        ]
    });

    const isLoading = status === "streaming" || status === "submitted";

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        sendMessage({
            text: input,
        });
        setInput("");
    };

    const progress = ((step + 1) / STEPS.length) * 100;
    const current = STEPS[step];
    const effectiveRole = selectedRole[0] ?? customRole;

    const canProceed = () => {
        if (current.id === "role") return !!effectiveRole;
        if (current.id === "macro") return selectedMacro.length > 0;
        if (current.id === "sub") return selectedSubs.length > 0;
        return true; // avoidTopics is optional
    };

    const handleNext = async () => {
        if (step < STEPS.length - 1) {
            setStep((s) => s + 1);
        } else {
            setSaving(true);
            try {
                // Merge macro areas + selected subs into interests list
                const interests = [...selectedMacro, ...selectedSubs];
                await fetch("/api/profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userIdentikit: {
                            role: effectiveRole,
                            skills: selectedSubs.filter((s) =>
                                Object.values(MACRO_AREAS["Tecnologia"]?.subs ?? {}).flat().includes(s)
                            ),
                            interests,
                            avoidTopics,
                        },
                    }),
                });
                router.push("/dashboard");
            } catch (e) {
                console.error(e);
            } finally {
                setSaving(false);
            }
        }
    };

    const handleCreateAiProfile = async () => {
        if (messages.length < 2) return;
        setExtracting(true);
        try {
            const res = await fetch("/api/onboarding/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages }),
            });
            if (res.ok) {
                const data = await res.json();

                const profileRes = await fetch("/api/profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userIdentikit: data.profile }),
                });

                if (profileRes.ok) {
                    router.push("/dashboard");
                } else {
                    console.error("Failed to compile profile with AI narrative");
                    setExtracting(false);
                }
            } else {
                console.error("Failed to extract profile");
                setExtracting(false);
            }
        } catch (e) {
            console.error(e);
            setExtracting(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
            <div className="mb-10"><OusiLogo size={30} color="#A6926D" /></div>

            {/* Progress bar / Header */}
            {!isAiMode && (
                <div className="w-full max-w-2xl mb-8">
                    <div className="h-px" style={{ background: "var(--border)" }}>
                        <motion.div className="h-full bg-ousi-tan"
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>
                </div>
            )}

            {/* Mode Switcher */}
            <div className="w-full max-w-2xl flex justify-end mb-6">
                <button
                    onClick={() => setIsAiMode(!isAiMode)}
                    className="text-[10px] tracking-widest text-ousi-stone hover:text-ousi-tan transition-colors border border-ousi-stone/20 rounded-full py-1.5 px-3"
                >
                    {isAiMode ? "◆ PASSA AL METODO MANUALE" : "✦ USA ASSISTENTE IA"}
                </button>
            </div>

            <div className="w-full max-w-2xl">
                {isAiMode ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[60vh] border border-ousi-stone/20 rounded-2xl overflow-hidden" style={{ background: "var(--bg-surface)" }}>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {messages.map((m: any) => (
                                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-ousi-stone/10 text-[var(--fg)] rounded-br-sm' : 'border border-ousi-stone/20 text-ousi-stone bg-[var(--bg)] rounded-bl-sm'}`}>
                                        {m.parts?.map((part: any, i: number) => part.type === "text" ? <span key={i}>{part.text}</span> : null)}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="px-4 py-3 border border-ousi-stone/20 rounded-2xl rounded-bl-sm bg-[var(--bg)]">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-ousi-tan rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <span className="w-1.5 h-1.5 bg-ousi-tan rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <span className="w-1.5 h-1.5 bg-ousi-tan rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-ousi-stone/10 bg-[var(--bg)]">
                            <form onSubmit={handleSubmit} className="flex gap-2">
                                <input
                                    value={input}
                                    onChange={handleInputChange}
                                    placeholder="Scrivi una risposta..."
                                    className="flex-1 bg-transparent border border-ousi-stone/30 rounded-full px-4 py-2 text-sm text-[var(--fg)] placeholder-ousi-stone/40 focus:outline-none focus:border-ousi-tan transition-colors"
                                />
                                <button type="submit" disabled={isLoading || !input.trim()} className="px-4 py-2 rounded-full bg-ousi-tan text-ousi-dark text-xs font-medium tracking-widest hover:bg-ousi-brown hover:text-ousi-cream disabled:opacity-30 transition-colors">
                                    INVIA
                                </button>
                            </form>
                            <div className="mt-4 flex justify-between items-center">
                                <p className="text-[10px] text-ousi-stone/60">Puoi fermare l'IA e creare il profilo quando vuoi.</p>
                                <button
                                    onClick={handleCreateAiProfile}
                                    disabled={extracting || messages.length < 2 || isLoading}
                                    className="px-4 py-2 rounded-full text-[10px] border border-ousi-tan text-ousi-tan hover:bg-ousi-tan hover:text-ousi-dark disabled:opacity-30 transition-all font-medium tracking-widest"
                                >
                                    {extracting ? "CREAZIONE IN CORSO..." : "✓ CREA PROFILO"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div key={step} {...slide} className="space-y-5">
                            <div>
                                <p className="text-ousi-tan text-[10px] tracking-[0.3em] mb-2">{current.label}</p>
                                <h2 className="text-2xl font-light" style={{ color: "var(--fg)" }}>{current.question}</h2>
                            </div>

                            {/* ── Step 1: Ruolo ─────────────────────────────────────────── */}
                            {current.id === "role" && (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {ROLE_PRESETS.map((r) => (
                                            <Chip key={r} label={r} selected={selectedRole.includes(r)}
                                                onClick={() => { setSelectedRole(selectedRole.includes(r) ? [] : [r]); setCustomRole(""); }}
                                            />
                                        ))}
                                    </div>
                                    <input type="text" value={customRole}
                                        onChange={(e) => { setCustomRole(e.target.value); setSelectedRole([]); }}
                                        placeholder="Oppure descriviti con parole tue…"
                                        className="w-full bg-[var(--bg-surface)] border border-ousi-stone/30 rounded-xl px-4 py-3 text-inherit placeholder-ousi-stone/30 text-sm focus:outline-none focus:border-ousi-tan transition-colors"
                                    />
                                </div>
                            )}

                            {/* ── Step 2: Macro aree ───────────────────────────────────── */}
                            {current.id === "macro" && (
                                <div className="space-y-2">
                                    <p className="text-ousi-stone/60 text-xs">Seleziona tutte le aree che ti interessano</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {Object.entries(MACRO_AREAS).map(([area, { icon }]) => (
                                            <MacroCard key={area} area={area} icon={icon}
                                                selected={selectedMacro.includes(area)}
                                                onClick={() => setSelectedMacro(toggle(selectedMacro, area))}
                                            />
                                        ))}
                                    </div>
                                    {selectedMacro.length > 0 && (
                                        <p className="text-ousi-tan text-[10px] tracking-widest pt-1">
                                            {selectedMacro.length} aree selezionate
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* ── Step 3: Sotto-categorie filtrate ─────────────────────── */}
                            {current.id === "sub" && (
                                <div className="space-y-2">
                                    <p className="text-ousi-stone/60 text-xs">Apri le categorie e scegli i temi specifici</p>
                                    {selectedMacro.map((area) =>
                                        Object.entries(MACRO_AREAS[area]?.subs ?? {}).map(([cat, opts]) => (
                                            <SubCategoryGroup key={`${area}-${cat}`}
                                                category={cat} options={opts} selected={selectedSubs}
                                                onToggle={(v) => setSelectedSubs(toggle(selectedSubs, v))}
                                            />
                                        ))
                                    )}
                                    {selectedSubs.length > 0 && (
                                        <p className="text-ousi-tan text-[10px] tracking-widest pt-1">
                                            {selectedSubs.length} argomenti selezionati
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* ── Step 4: Filtri ───────────────────────────────────────── */}
                            {current.id === "avoidTopics" && (
                                <div className="space-y-4">
                                    <p className="text-ousi-stone/60 text-xs">Opzionale — puoi modificarlo in seguito</p>
                                    <div className="flex flex-wrap gap-2">
                                        {AVOID_PRESETS.map((a) => (
                                            <Chip key={a} label={a} selected={avoidTopics.includes(a)}
                                                onClick={() => setAvoidTopics(toggle(avoidTopics, a))}
                                            />
                                        ))}
                                    </div>
                                    {avoidTopics.length > 0 && (
                                        <p className="text-ousi-stone/50 text-[10px] tracking-widest">
                                            Esclusi: {avoidTopics.join(", ")}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Nav */}
                            <div className="flex items-center justify-between pt-4">
                                <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))}
                                    disabled={step === 0}
                                    className="px-4 py-2 rounded-full text-ousi-stone text-xs tracking-widest hover:bg-ousi-stone/10 hover:text-ousi-brown disabled:opacity-20 transition-colors"
                                >
                                    ← INDIETRO
                                </button>
                                <button type="button" onClick={handleNext}
                                    disabled={!canProceed() || saving}
                                    className="px-6 py-2 rounded-full bg-ousi-tan text-ousi-dark text-xs font-medium tracking-widest hover:bg-ousi-brown hover:text-ousi-cream disabled:opacity-30 transition-all duration-300"
                                >
                                    {saving ? "SALVATAGGIO…" : step === STEPS.length - 1 ? "COMPLETA →" : "AVANTI →"}
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            {/* Dots */}
            {!isAiMode && (
                <div className="flex gap-2 mt-10">
                    {STEPS.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${i === step ? "bg-ousi-tan" : i < step ? "bg-ousi-brown" : "bg-ousi-stone/30"
                            }`} />
                    ))}
                </div>
            )}
        </main>
    );
}

export default dynamic(() => Promise.resolve(OnboardingPageContent), { ssr: false });

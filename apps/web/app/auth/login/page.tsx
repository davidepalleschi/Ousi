"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OusiLogo } from "@/components/OusiLogo";

export default function LoginPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await signIn.email({ email: form.email, password: form.password });
        setLoading(false);
        if (res.error) {
            setError(res.error.message ?? "Credenziali non valide");
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center px-6">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm space-y-8"
            >
                <div className="text-center space-y-3">
                    <div className="flex justify-center">
                        <OusiLogo size={40} color="#A6926D" />
                    </div>
                    <h1 className="text-3xl font-light tracking-[0.2em]" style={{ color: "var(--fg)" }}>OUSI</h1>
                    <p className="text-ousi-stone text-sm tracking-widest">ACCEDI</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {[
                        { id: "email", label: "Email", type: "email" as const },
                        { id: "password", label: "Password", type: "password" as const },
                    ].map(({ id, label, type }) => (
                        <div key={id} className="space-y-1">
                            <label htmlFor={id} className="text-ousi-stone text-xs tracking-widest">{label}</label>
                            <input
                                id={id}
                                type={type}
                                value={form[id as keyof typeof form]}
                                onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
                                required
                                className="w-full bg-transparent border border-ousi-stone/30 rounded-xl px-4 py-3 text-inherit focus:outline-none focus:border-ousi-tan transition-colors text-sm"
                            />
                        </div>
                    ))}

                    {error && <p className="text-red-500 text-xs">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-full bg-ousi-tan text-ousi-dark text-sm font-medium tracking-widest hover:bg-ousi-brown hover:text-ousi-cream disabled:opacity-40 transition-all duration-300"
                    >
                        {loading ? "…" : "ENTRA"}
                    </button>
                </form>

                <p className="text-center text-ousi-stone/60 text-xs">
                    Non hai un account?{" "}
                    <Link href="/auth/signup" className="text-ousi-tan hover:text-ousi-brown transition-colors">
                        Registrati
                    </Link>
                </p>
            </motion.div>
        </main>
    );
}

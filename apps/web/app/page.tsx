"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { OusiLogo } from "@/components/OusiLogo";

export default function HomePage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
            {/* Mirino Icon Placeholder — replace with your SVG */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mb-10"
            >
                <OusiLogo size={64} color="#A6926D" />
            </motion.div>

            <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl font-light tracking-[0.2em] mb-4"
                style={{ color: "var(--fg)" }}
            >
                OUSI
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-ousi-stone text-lg font-light max-w-md mb-12 leading-relaxed"
            >
                Il web letto per te. Ogni giorno una selezione di notizie curata dalla tua IA personale.
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="flex flex-col sm:flex-row gap-4"
            >
                <Link
                    href="/onboarding"
                    className="px-8 py-3 rounded-full bg-ousi-tan text-ousi-dark font-medium tracking-widest text-sm hover:bg-ousi-brown hover:text-ousi-cream transition-all duration-300"
                >
                    INIZIA
                </Link>
                <Link
                    href="/auth/login"
                    className="px-8 py-3 rounded-full border border-ousi-stone font-medium tracking-widest text-sm hover:border-ousi-brown hover:text-ousi-brown transition-all duration-300"
                    style={{ color: "var(--fg)" }}
                >
                    ACCEDI
                </Link>
            </motion.div>
        </main>
    );
}

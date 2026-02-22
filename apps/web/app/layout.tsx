import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Ousi — Intelligent News Curation",
    description: "Your personal AI-powered news curator. Discover, filter, and receive a curated newsletter tailored to you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="it">
            {/* bg and text colors come from CSS variables in globals.css (prefers-color-scheme) */}
            <body className="min-h-screen font-sans antialiased"
                style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}>
                {children}
            </body>
        </html>
    );
}

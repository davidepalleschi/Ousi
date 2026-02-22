import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "media",
    theme: {
        extend: {
            colors: {
                ousi: {
                    cream: "#D9D4C7",
                    brown: "#735F3C",
                    tan: "#A6926D",
                    stone: "#BFB8AA",
                    dark: "#261807",
                },
                // Neutral semantic tokens — reference CSS vars
                bg: "var(--bg)",
                surface: "var(--bg-surface)",
                border: "var(--border)",
                fg: "var(--fg)",
            },
            fontFamily: {
                sans: ["var(--font-inter)", "system-ui", "sans-serif"],
            },
            animation: {
                "fade-in": "fadeIn 0.5s ease forwards",
            },
            keyframes: {
                fadeIn: {
                    from: { opacity: "0", transform: "translateY(8px)" },
                    to: { opacity: "1", transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
};

export default config;

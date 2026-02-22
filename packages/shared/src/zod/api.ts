import { z } from "zod";

// ─── Process URL ───────────────────────────────────────────────────────────
export const ProcessUrlInputSchema = z.object({
    url: z.string().url(),
    userIdentikit: z.any().optional(),
});
export type ProcessUrlInput = z.infer<typeof ProcessUrlInputSchema>;

export const ProcessUrlOutputSchema = z.object({
    url: z.string().url(),
    title: z.string(),
    relevanceScore: z.number().min(1).max(10),
    summary: z.string(),
    source: z.string().optional(),
});
export type ProcessUrlOutput = z.infer<typeof ProcessUrlOutputSchema>;

// ─── Discovery ─────────────────────────────────────────────────────────────
export const DiscoverInputSchema = z.object({
    keywords: z.array(z.string()),
    sources: z.array(z.enum(["newsapi", "rss"])).default(["newsapi", "rss"]),
    maxResults: z.number().default(20),
});
export type DiscoverInput = z.infer<typeof DiscoverInputSchema>;

export const DiscoveredArticleSchema = z.object({
    url: z.string().url(),
    title: z.string(),
    source: z.enum(["newsapi", "rss"]),
    publishedAt: z.string().optional(),
});
export type DiscoveredArticle = z.infer<typeof DiscoveredArticleSchema>;

export const DiscoverOutputSchema = z.object({
    articles: z.array(DiscoveredArticleSchema),
});
export type DiscoverOutput = z.infer<typeof DiscoverOutputSchema>;

// ─── Scored Article (matches DB model) ───────────────────────────────────
export const ScoredArticleSchema = z.object({
    id: z.string(),
    userId: z.string(),
    url: z.string().url(),
    urlHash: z.string(),
    title: z.string(),
    summary: z.string(),
    relevanceScore: z.number().min(1).max(10),
    source: z.string(),
    publishedAt: z.date().nullable(),
    createdAt: z.date(),
});
export type ScoredArticle = z.infer<typeof ScoredArticleSchema>;

// ─── Onboarding ────────────────────────────────────────────────────────────
export const OnboardingStepSchema = z.object({
    step: z.enum(["role", "skills", "interests", "avoid"]),
    value: z.union([z.string(), z.array(z.string())]),
});
export type OnboardingStep = z.infer<typeof OnboardingStepSchema>;

import { z } from "zod";

// ─── User Identikit ────────────────────────────────────────────────────────
export const UserIdentikitSchema = z.object({
  role: z.string().describe("Ruolo professionale"),
  skills: z.array(z.string()).describe("Competenze tecniche"),
  interests: z.array(z.string()).describe("Interessi core"),
  avoidTopics: z.array(z.string()).describe("Argomenti da evitare"),
  aiProfile: z.string().optional().describe("Profilo generato dall'IA"),
});
export type UserIdentikit = z.infer<typeof UserIdentikitSchema>;

// ─── Profile ───────────────────────────────────────────────────────────────
export const ProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userIdentikit: UserIdentikitSchema.nullable(),
  newsletterFrequency: z.enum(["daily", "weekly"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Profile = z.infer<typeof ProfileSchema>;

// ─── Processed Article ─────────────────────────────────────────────────────
export const ProcessedArticleSchema = z.object({
  id: z.string(),
  urlHash: z.string(),
  summary: z.string(),
  sentAt: z.date().nullable(),
  createdAt: z.date(),
});
export type ProcessedArticle = z.infer<typeof ProcessedArticleSchema>;

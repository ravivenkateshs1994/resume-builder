import { z } from "zod";

// ── Gap Severity ──────────────────────────────────────────────────────────────

export const GapSeveritySchema = z.enum([
  "critical",
  "important",
  "nice-to-have",
]);

export type GapSeverity = z.infer<typeof GapSeveritySchema>;

// ── Individual Gap Entry ──────────────────────────────────────────────────────

export const SkillGapSchema = z.object({
  skill: z.string(),
  category: z.string(),
  severity: GapSeveritySchema,
  reason: z.string(),
  suggestedResource: z.string().default(""),
  estimatedLearningTime: z.string().default(""),
});

export type SkillGap = z.infer<typeof SkillGapSchema>;

// ── Hiring Probability ────────────────────────────────────────────────────────

export const HiringProbabilitySchema = z.enum([
  "low",
  "moderate",
  "high",
  "very-high",
]);

export type HiringProbability = z.infer<typeof HiringProbabilitySchema>;

// ── Full Gap Analysis Output ──────────────────────────────────────────────────

export const GapAnalysisOutputSchema = z.object({
  overallMatchScore: z.number().min(0).max(100),
  matchedSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  criticalGaps: z.array(SkillGapSchema).default([]),
  importantGaps: z.array(SkillGapSchema).default([]),
  niceToHaveGaps: z.array(SkillGapSchema).default([]),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  keyRecommendations: z.array(z.string()).default([]),
  hiringProbability: HiringProbabilitySchema,
  summary: z.string(),
});

export type GapAnalysisOutput = z.infer<typeof GapAnalysisOutputSchema>;

import { z } from "zod";

// ── Resource Types ────────────────────────────────────────────────────────────

export const ResourceTypeSchema = z.enum([
  "course",
  "book",
  "project",
  "certification",
  "practice",
  "community",
]);

export const ResourceCostSchema = z.enum(["free", "paid", "subscription"]);

export const RoadmapResourceSchema = z.object({
  type: ResourceTypeSchema,
  title: z.string(),
  provider: z.string().default(""),
  url: z.string().default(""),
  cost: ResourceCostSchema.default("free"),
  estimatedHours: z.number().optional(),
});

export type RoadmapResource = z.infer<typeof RoadmapResourceSchema>;

// ── Phase ─────────────────────────────────────────────────────────────────────

export const RoadmapPhaseSchema = z.object({
  phase: z.number().int().min(1),
  title: z.string(),
  duration: z.string(),
  objectives: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  resources: z.array(RoadmapResourceSchema).default([]),
  milestones: z.array(z.string()).default([]),
  projects: z.array(z.string()).default([]),
});

export type RoadmapPhase = z.infer<typeof RoadmapPhaseSchema>;

// ── Full Roadmap Output ───────────────────────────────────────────────────────

export const CareerRoadmapOutputSchema = z.object({
  targetRole: z.string(),
  currentLevel: z.string(),
  targetLevel: z.string(),
  estimatedTimeline: z.string(),
  totalPhases: z.number().int(),
  phases: z.array(RoadmapPhaseSchema),
  quickWins: z.array(z.string()).default([]),
  longTermGoals: z.array(z.string()).default([]),
  successMetrics: z.array(z.string()).default([]),
  summary: z.string(),
});

export type CareerRoadmapOutput = z.infer<typeof CareerRoadmapOutputSchema>;

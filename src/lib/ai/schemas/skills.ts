import { z } from "zod";

// ── Resume Skill Extraction ────────────────────────────────────────────────────

export const SkillExtractionOutputSchema = z.object({
  skills: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  methodologies: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
});

export type SkillExtractionOutput = z.infer<typeof SkillExtractionOutputSchema>;

// ── Job Description Requirements ──────────────────────────────────────────────

export const JobSenioritySchema = z.enum([
  "entry",
  "junior",
  "mid",
  "senior",
  "lead",
  "manager",
  "director",
  "executive",
  "unknown",
]);

export type JobSeniority = z.infer<typeof JobSenioritySchema>;

export const JobRequirementsSchema = z.object({
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  yearsExperience: z.number().nullable().default(null),
  seniority: JobSenioritySchema.default("unknown"),
  responsibilities: z.array(z.string()).default([]),
});

export type JobRequirementsOutput = z.infer<typeof JobRequirementsSchema>;

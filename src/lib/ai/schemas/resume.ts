import { z } from "zod";

// ── Sub-schemas ────────────────────────────────────────────────────────────────

export const ParsedPersonalInfoSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedin: z.string().default(""),
  website: z.string().default(""),
  jobTitle: z.string().default(""),
});

export const ParsedWorkExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  location: z.string().default(""),
  startDate: z.string(),
  endDate: z.string(),
  bullets: z.array(z.string()).default([]),
});

export const ParsedEducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  gpa: z.string().default(""),
  honors: z.string().default(""),
});

export const ParsedCertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().default(""),
  date: z.string().default(""),
});

// ── Root Schema ────────────────────────────────────────────────────────────────

export const ParsedResumeSchema = z.object({
  personalInfo: ParsedPersonalInfoSchema,
  summary: z.string().default(""),
  workExperience: z.array(ParsedWorkExperienceSchema).default([]),
  education: z.array(ParsedEducationSchema).default([]),
  skills: z.array(z.string()).default([]),
  certifications: z.array(ParsedCertificationSchema).default([]),
  targetRole: z.string().default(""),
});

export type ParsedResumeOutput = z.infer<typeof ParsedResumeSchema>;
export type ParsedWorkExperience = z.infer<typeof ParsedWorkExperienceSchema>;
export type ParsedEducation = z.infer<typeof ParsedEducationSchema>;
export type ParsedCertification = z.infer<typeof ParsedCertificationSchema>;
export type ParsedPersonalInfo = z.infer<typeof ParsedPersonalInfoSchema>;

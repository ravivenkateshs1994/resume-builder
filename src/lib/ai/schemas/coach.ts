import { z } from "zod";

// ── Message ───────────────────────────────────────────────────────────────────

export const CoachMessageRoleSchema = z.enum(["user", "assistant", "system"]);

export const CoachMessageSchema = z.object({
  id: z.string(),
  role: CoachMessageRoleSchema,
  content: z.string(),
  timestamp: z.string(),
});

export type CoachMessage = z.infer<typeof CoachMessageSchema>;

// ── Context ───────────────────────────────────────────────────────────────────

export const CoachContextSchema = z.object({
  resumeText: z.string().optional(),
  jobDescription: z.string().optional(),
  gapSummary: z.string().optional(),
  targetRole: z.string().optional(),
  careerStage: z.string().optional(),
  previousMessages: z.array(CoachMessageSchema).default([]),
});

export type CoachContext = z.infer<typeof CoachContextSchema>;

// ── Request ───────────────────────────────────────────────────────────────────

export const CoachRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  context: CoachContextSchema,
  stream: z.boolean().default(false),
});

export type CoachRequest = z.infer<typeof CoachRequestSchema>;

// ── Interview Questions Output ────────────────────────────────────────────────

export const InterviewQuestionSchema = z.object({
  question: z.string(),
  assessing: z.string(),
  answerFramework: z.string(),
  commonMistakes: z.array(z.string()).default([]),
  followUps: z.array(z.string()).default([]),
});

export const InterviewPrepOutputSchema = z.object({
  category: z.enum(["behavioral", "technical", "system-design", "case-study"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  questions: z.array(InterviewQuestionSchema),
});

export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;
export type InterviewPrepOutput = z.infer<typeof InterviewPrepOutputSchema>;

/**
 * ResumeParserAgent
 *
 * Parses raw resume text into structured data using generateObject + Qwen3-235B.
 * All retry logic, error classification, model building, and logging are handled
 * by the shared `agent-utils` module.
 *
 * Server-only. Never import from client components.
 */

import { generateObject } from "ai";
import { z } from "zod";
import { TASK_ROUTES, type ModelId } from "../model-router";
import type { PipelineState, PipelineError } from "../graphs/state";
import type { NodeFn } from "../graphs/nodes";
import type { ParsedResumeOutput } from "../schemas/resume";
import {
  runWithRetry,
  buildOpenRouterModel,
  truncateToTokens,
  type AgentRunSuccess,
  type AgentRunFailure,
  type AgentAttemptRecord,
} from "../lib/agent-utils";

// ─────────────────────────────────────────────────────────────────────────────
// § 1 — SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

const PersonalInfoSchema = z.object({
  fullName: z.string().describe("Candidate's full legal name"),
  email: z.string().describe("Primary email address"),
  phone: z.string().describe("Primary phone number"),
  location: z.string().describe("City, State/Province, Country"),
  linkedin: z.string().describe("LinkedIn profile URL or empty string"),
  website: z.string().describe("Personal website or portfolio URL or empty string"),
  jobTitle: z.string().describe("Current or most recent job title"),
});

const ExperienceEntrySchema = z.object({
  company: z.string().describe("Employer name"),
  title: z.string().describe("Job title held at this company"),
  location: z.string().describe("City/country of work, or 'Remote'"),
  startDate: z.string().describe("Start date in 'Mon YYYY' format"),
  endDate: z.string().describe("End date in 'Mon YYYY' or 'Present'"),
  bullets: z.array(z.string()).describe("Accomplishment bullets — one per array entry"),
});

const EducationEntrySchema = z.object({
  institution: z.string().describe("University or college name"),
  degree: z.string().describe("Degree type (e.g. Bachelor of Science)"),
  field: z.string().describe("Field of study or major"),
  startDate: z.string().describe("Start year or 'Mon YYYY'"),
  endDate: z.string().describe("Graduation year or 'Mon YYYY' or 'Present'"),
  gpa: z.string().describe("GPA if listed, otherwise empty string"),
  honors: z.string().describe("Honors or distinctions if listed, otherwise empty string"),
});

export const ResumeParserOutputSchema = z.object({
  personalInfo: PersonalInfoSchema,
  summary: z.string().describe("Professional summary verbatim from the resume"),
  experience: z.array(ExperienceEntrySchema).describe("Work experience in reverse chronological order"),
  education: z.array(EducationEntrySchema).describe("Education in reverse chronological order"),
  skills: z.array(z.string()).describe("All skills as individual strings with canonical capitalization"),
});

export type ResumeParserOutput = z.infer<typeof ResumeParserOutputSchema>;
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;
export type EducationEntry = z.infer<typeof EducationEntrySchema>;
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// § 2 — INPUT / RESULT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ResumeParserInput {
  /** Raw text extracted from PDF or DOCX — no HTML, no markdown. */
  resumeText: string;
  /** Caller-supplied correlation ID for structured logs. */
  traceId?: string;
}

// Internal attempt record shape (backward compat with old AttemptRecord)
interface AttemptRecord {
  attempt: number;
  modelId: ModelId;
  errorKind: "retryable" | "advance_model";
  message: string;
  durationMs: number;
}

export type ResumeParserSuccess = AgentRunSuccess<ResumeParserOutput>;

export interface ResumeParserFailure {
  success: false;
  error: ResumeParserError;
  attemptCount: number;
  durationMs: number;
  attemptLog: AttemptRecord[];
}

export type ResumeParserResult = ResumeParserSuccess | ResumeParserFailure;

// ─────────────────────────────────────────────────────────────────────────────
// § 3 — ERROR CLASS (kept for backward compat)
// ─────────────────────────────────────────────────────────────────────────────

export type ResumeParserErrorKind =
  | "all_models_exhausted"
  | "validation_failed"
  | "empty_input"
  | "provider_error"
  | "timeout";

export class ResumeParserError extends Error {
  readonly kind: ResumeParserErrorKind;
  readonly attemptLog: AttemptRecord[];
  readonly traceId: string | undefined;

  constructor(
    kind: ResumeParserErrorKind,
    message: string,
    attemptLog: AttemptRecord[],
    traceId?: string
  ) {
    super(message);
    this.name = "ResumeParserError";
    this.kind = kind;
    this.attemptLog = attemptLog;
    this.traceId = traceId;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4 — SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `\
You are an expert resume parser with deep knowledge of professional document formats.

Parse the provided resume text into structured JSON. Extract ALL information with maximum fidelity.

RULES:
- Extract only what is explicitly present. Never hallucinate, infer, or fabricate data.
- Normalize all dates to "Mon YYYY" format (e.g. "Jan 2022") or the literal string "Present".
- Split work experience descriptions into individual bullet strings. One bullet per array entry.
- List each skill as a standalone string with correct capitalization:
    • "JavaScript" not "javascript" or "JS"
    • "PostgreSQL" not "postgres" or "Postgres"
    • "Next.js" not "NextJS"
- If a field is not present in the resume, use an empty string "" or empty array [].
- Output must be valid JSON that strictly conforms to the provided schema.`;

// ─────────────────────────────────────────────────────────────────────────────
// § 5 — RESUME PARSER AGENT
// ─────────────────────────────────────────────────────────────────────────────

export class ResumeParserAgent {
  private readonly chain: readonly ModelId[];

  constructor() {
    this.chain = TASK_ROUTES.resumeParser.chain;
  }

  async run(input: ResumeParserInput): Promise<ResumeParserResult> {
    if (!input.resumeText?.trim()) {
      const error = new ResumeParserError("empty_input", "resumeText is empty or whitespace.", [], input.traceId);
      return { success: false, error, attemptCount: 0, durationMs: 0, attemptLog: [] };
    }

    const text = truncateToTokens(input.resumeText, 1_800); // ≈ 6 840 chars

    const result = await runWithRetry(
      this.chain,
      (modelId) =>
        generateObject({
          model: buildOpenRouterModel(modelId),
          schema: ResumeParserOutputSchema,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Parse the following resume:\n\n${text}` }],
          temperature: 0,
          maxOutputTokens: 4_096,
          maxRetries: 0,
        }),
      "ResumeParserAgent",
      input.traceId
    );

    if (result.success) return result;

    // Adapt AgentRunFailure → ResumeParserFailure for backward compat
    const log = adaptAttemptLog(result.attemptLog);
    return {
      success: false,
      error: new ResumeParserError(result.errorKind, result.errorMessage, log, input.traceId),
      attemptCount: result.attemptCount,
      durationMs: result.durationMs,
      attemptLog: log,
    };
  }

  async runAsNode(state: PipelineState): Promise<Partial<PipelineState>> {
    if (!state.rawResumeText?.trim()) {
      return appendError(state, "resumeParserNode", "rawResumeText is empty.");
    }

    const result = await this.run({
      resumeText: state.rawResumeText,
      traceId: state.currentNode,
    });

    if (!result.success) {
      const log = result.attemptLog.map((a) => `${a.modelId}(${a.errorKind})`).join(" → ");
      return appendError(state, "resumeParserNode", result.error.message + (log ? ` | ${log}` : ""));
    }

    const mapped = mapToPipelineSchema(result.data);
    return {
      parsedResume: mapped,
      targetRole:
        state.targetRole ||
        mapped.targetRole ||
        result.data.personalInfo.jobTitle ||
        undefined,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6 — SCHEMA ADAPTER  (ResumeParserOutput → ParsedResumeOutput)
// ─────────────────────────────────────────────────────────────────────────────

function mapToPipelineSchema(output: ResumeParserOutput): ParsedResumeOutput {
  return {
    personalInfo: {
      fullName: output.personalInfo.fullName,
      email: output.personalInfo.email,
      phone: output.personalInfo.phone,
      location: output.personalInfo.location,
      linkedin: output.personalInfo.linkedin,
      website: output.personalInfo.website,
      jobTitle: output.personalInfo.jobTitle,
    },
    summary: output.summary,
    workExperience: output.experience.map((exp) => ({
      company: exp.company,
      title: exp.title,
      location: exp.location,
      startDate: exp.startDate,
      endDate: exp.endDate,
      bullets: exp.bullets,
    })),
    education: output.education.map((edu) => ({
      institution: edu.institution,
      degree: edu.degree,
      field: edu.field,
      startDate: edu.startDate,
      endDate: edu.endDate,
      gpa: edu.gpa,
      honors: edu.honors,
    })),
    skills: output.skills,
    certifications: [],
    targetRole: output.personalInfo.jobTitle,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 7 — UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function adaptAttemptLog(log: AgentAttemptRecord[]): AttemptRecord[] {
  return log.map((a) => ({
    attempt: a.attempt,
    modelId: a.modelId,
    errorKind: a.policy as "retryable" | "advance_model",
    message: a.message,
    durationMs: a.durationMs,
  }));
}

function appendError(state: PipelineState, node: string, message: string): Partial<PipelineState> {
  const entry: PipelineError = { node, message, timestamp: new Date().toISOString() };
  return { errors: [...state.errors, entry] };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 8 — SINGLETON + NODE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export const resumeParserAgent = new ResumeParserAgent();

export const resumeParserNode: NodeFn = (state) => resumeParserAgent.runAsNode(state);

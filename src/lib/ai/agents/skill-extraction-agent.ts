/**
 * SkillExtractionAgent
 *
 * Extracts a rich, semantically-categorized skill inventory from a parsed
 * resume using generateObject + Qwen3-235B.
 *
 * Server-only. Never import from client components.
 */

import { generateObject } from "ai";
import { z } from "zod";
import { TASK_ROUTES, type ModelId } from "../model-router";
import type { PipelineState, PipelineError } from "../graphs/state";
import type { NodeFn } from "../graphs/nodes";
import type { ParsedResumeOutput } from "../schemas/resume";
import type { SkillExtractionOutput } from "../schemas/skills";
import type { ResumeParserOutput } from "./resume-parser-agent";
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

const SkillEntrySchema = z.object({
  name: z.string().describe("Canonical skill name with correct capitalization"),
  proficiencySignal: z
    .enum(["explicit", "inferred", "mentioned"])
    .describe("explicit=in Skills section, inferred=demonstrated in experience, mentioned=appears once"),
  yearsEvidence: z
    .number()
    .nullable()
    .describe("Years of evidence from earliest to most recent usage. null if not calculable."),
});

export const SkillExtractionAgentOutputSchema = z.object({
  technicalSkills: z.array(SkillEntrySchema).describe("Programming languages, protocols, paradigms"),
  frameworks: z.array(SkillEntrySchema).describe("App frameworks and libraries"),
  tools: z.array(SkillEntrySchema).describe("Dev tools, CI/CD, build systems, IaC"),
  cloudPlatforms: z.array(SkillEntrySchema).describe("Cloud providers and managed services"),
  databases: z.array(SkillEntrySchema).describe("Database systems and ORMs"),
  softSkills: z.array(z.string()).describe("Leadership, collaboration, communication patterns"),
  certifications: z.array(z.string()).describe("Formal credentials only"),
  methodologies: z.array(z.string()).describe("Engineering practices: Agile, TDD, DevOps, etc."),
  primaryLanguages: z.array(z.string()).describe("Top 3-5 languages by evidence, descending confidence"),
  senioritySummary: z.string().describe("One-sentence assessment of candidate seniority level"),
});

export type SkillExtractionAgentOutput = z.infer<typeof SkillExtractionAgentOutputSchema>;
export type SkillEntry = z.infer<typeof SkillEntrySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// § 2 — INPUT / RESULT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface SkillExtractionInput {
  parsedResume: ParsedResumeOutput | ResumeParserOutput;
  traceId?: string;
}

interface AttemptRecord {
  attempt: number;
  modelId: ModelId;
  errorKind: "retryable" | "advance_model";
  message: string;
  durationMs: number;
}

export type SkillExtractionSuccess = AgentRunSuccess<SkillExtractionAgentOutput>;

export interface SkillExtractionFailure {
  success: false;
  error: SkillExtractionError;
  attemptCount: number;
  durationMs: number;
  attemptLog: AttemptRecord[];
}

export type SkillExtractionResult = SkillExtractionSuccess | SkillExtractionFailure;

// ─────────────────────────────────────────────────────────────────────────────
// § 3 — ERROR CLASS (backward compat)
// ─────────────────────────────────────────────────────────────────────────────

export type SkillExtractionErrorKind =
  | "empty_input"
  | "all_models_exhausted"
  | "validation_failed"
  | "provider_error";

export class SkillExtractionError extends Error {
  readonly kind: SkillExtractionErrorKind;
  readonly attemptLog: AttemptRecord[];
  readonly traceId: string | undefined;

  constructor(
    kind: SkillExtractionErrorKind,
    message: string,
    attemptLog: AttemptRecord[],
    traceId?: string
  ) {
    super(message);
    this.name = "SkillExtractionError";
    this.kind = kind;
    this.attemptLog = attemptLog;
    this.traceId = traceId;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4 — SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `\
You are a senior technical recruiter and skills taxonomy expert.

Analyze the provided parsed resume and extract a comprehensive, semantically categorized skill inventory.

RULES:
1. Use canonical, correctly capitalized names:
   • "TypeScript" not "typescript", "PostgreSQL" not "postgres", "Next.js" not "NextJS"
   • "AWS" not "Amazon Web Services", "GitHub Actions" not "GH Actions"

2. Categorize precisely:
   • technicalSkills  → languages, paradigms, protocols (TypeScript, Python, REST, GraphQL)
   • frameworks       → app frameworks and libraries (React, Next.js, FastAPI, Spring Boot)
   • tools            → dev tools, CI/CD, build, IaC (Docker, Terraform, Webpack)
   • cloudPlatforms   → cloud providers and services (AWS, GCP, Vercel, Supabase)
   • databases        → DB systems and ORMs (PostgreSQL, MongoDB, Prisma, Redis)
   • softSkills       → leadership, collaboration, communication patterns
   • certifications   → formal credentials only (AWS Solutions Architect, Google Cloud Professional)
   • methodologies    → engineering practices (Agile, TDD, CI/CD, DDD)

3. proficiencySignal:
   • "explicit"  → skill listed in a dedicated Skills section
   • "inferred"  → skill demonstrated through work experience descriptions
   • "mentioned" → skill appears only once or in passing

4. yearsEvidence: calculate from earliest to most recent usage. null if not calculable.
5. primaryLanguages: top 3-5 by evidence, descending order.
6. Do NOT invent skills not evidenced in the resume.
7. Return valid JSON conforming exactly to the provided schema.`;

// ─────────────────────────────────────────────────────────────────────────────
// § 5 — RESUME SERIALIZER
// ─────────────────────────────────────────────────────────────────────────────

function serializeForExtraction(resume: ParsedResumeOutput | ResumeParserOutput): string {
  const lines: string[] = [];
  const { personalInfo } = resume;

  if (personalInfo.jobTitle) lines.push(`Title: ${personalInfo.jobTitle}`);
  if (personalInfo.location) lines.push(`Location: ${personalInfo.location}`);

  if (resume.summary) lines.push(`\n## Summary\n${resume.summary}`);

  // Handle both ParsedResumeOutput (workExperience) and ResumeParserOutput (experience)
  const experiences =
    "workExperience" in resume ? resume.workExperience : resume.experience;

  if (experiences.length > 0) {
    lines.push("\n## Work Experience");
    for (const exp of experiences) {
      lines.push(`### ${exp.title} at ${exp.company} (${exp.startDate}–${exp.endDate})`);
      for (const bullet of exp.bullets) lines.push(`- ${bullet}`);
    }
  }

  if (resume.education.length > 0) {
    lines.push("\n## Education");
    for (const edu of resume.education) {
      lines.push(`${edu.degree}${edu.field ? ` in ${edu.field}` : ""} — ${edu.institution} (${edu.endDate})`);
    }
  }

  if (resume.skills.length > 0) {
    lines.push(`\n## Skills\n${resume.skills.join(", ")}`);
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6 — SKILL EXTRACTION AGENT
// ─────────────────────────────────────────────────────────────────────────────

export class SkillExtractionAgent {
  private readonly chain: readonly ModelId[];

  constructor() {
    this.chain = TASK_ROUTES.skillExtraction.chain;
  }

  async run(input: SkillExtractionInput): Promise<SkillExtractionResult> {
    const raw = serializeForExtraction(input.parsedResume);
    if (!raw.trim()) {
      const error = new SkillExtractionError("empty_input", "parsedResume produces empty text.", [], input.traceId);
      return { success: false, error, attemptCount: 0, durationMs: 0, attemptLog: [] };
    }

    const text = truncateToTokens(raw, 1_700); // ≈ 6 460 chars

    const result = await runWithRetry(
      this.chain,
      (modelId) =>
        generateObject({
          model: buildOpenRouterModel(modelId),
          schema: SkillExtractionAgentOutputSchema,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Extract skills from this resume:\n\n${text}` }],
          temperature: 0,
          maxOutputTokens: 3_000,
          maxRetries: 0,
        }),
      "SkillExtractionAgent",
      input.traceId
    );

    if (result.success) return result;

    const log = adaptAttemptLog(result.attemptLog);
    return {
      success: false,
      error: new SkillExtractionError(result.errorKind, result.errorMessage, log, input.traceId),
      attemptCount: result.attemptCount,
      durationMs: result.durationMs,
      attemptLog: log,
    };
  }

  async runAsNode(state: PipelineState): Promise<Partial<PipelineState>> {
    if (!state.parsedResume) {
      return appendError(state, "skillExtractionNode", "parsedResume is not set.");
    }

    const result = await this.run({
      parsedResume: state.parsedResume,
      traceId: state.currentNode,
    });

    if (!result.success) {
      const log = result.attemptLog.map((a) => `${a.modelId}(${a.errorKind})`).join(" → ");
      return appendError(state, "skillExtractionNode", result.error.message + (log ? ` | ${log}` : ""));
    }

    return {
      enrichedSkills: result.data,
      // Backward-compat flat format for consumers that predate SkillExtractionAgent
      resumeSkills: toFlatSkillOutput(result.data),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 7 — FLAT SKILL ADAPTER  (SkillExtractionAgentOutput → SkillExtractionOutput)
// ─────────────────────────────────────────────────────────────────────────────

function toFlatSkillOutput(data: SkillExtractionAgentOutput): SkillExtractionOutput {
  return {
    skills: [
      ...data.technicalSkills.map((s) => s.name),
      ...data.primaryLanguages,
    ],
    technologies: data.technicalSkills.map((s) => s.name),
    tools: data.tools.map((s) => s.name),
    frameworks: data.frameworks.map((s) => s.name),
    certifications: data.certifications,
    methodologies: data.methodologies,
    softSkills: data.softSkills,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 8 — UTILITIES
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
// § 9 — SINGLETON + NODE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

export const skillExtractionAgent = new SkillExtractionAgent();

export const skillExtractionNode: NodeFn = (state) => skillExtractionAgent.runAsNode(state);

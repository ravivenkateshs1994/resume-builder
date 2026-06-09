/**
 * ATSAnalysisAgent
 *
 * Scores a resume against a job description for ATS (Applicant Tracking System)
 * compatibility using generateObject + DeepSeek R1.
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
// § 1 — SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const ATSAnalysisOutputSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe("ATS match score 0-100. 80+=excellent, 60-79=good, 40-59=moderate, <40=poor"),
  matchedKeywords: z
    .array(z.string())
    .describe("Keywords from the job description that appear in the resume"),
  missingKeywords: z
    .array(z.string())
    .describe("Important keywords from the job description absent from the resume"),
  recommendations: z
    .array(z.string())
    .describe("Specific, actionable changes to improve ATS match (e.g. 'Add Kubernetes to Skills section')"),
  strengths: z
    .array(z.string())
    .describe("What the resume does well for this specific role"),
  weaknesses: z
    .array(z.string())
    .describe("Specific gaps or formatting issues that reduce ATS parse score"),
});

export type ATSAnalysisOutput = z.infer<typeof ATSAnalysisOutputSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// § 2 — INPUT / RESULT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ATSAnalysisInput {
  parsedResume: ParsedResumeOutput;
  jobDescription: string;
  targetRole?: string;
  traceId?: string;
}

interface AttemptRecord {
  attempt: number;
  modelId: ModelId;
  errorKind: "retryable" | "advance_model";
  message: string;
  durationMs: number;
}

export type ATSAnalysisSuccess = AgentRunSuccess<ATSAnalysisOutput>;

export interface ATSAnalysisFailure {
  success: false;
  error: ATSAnalysisError;
  attemptCount: number;
  durationMs: number;
  attemptLog: AttemptRecord[];
}

export type ATSAnalysisResult = ATSAnalysisSuccess | ATSAnalysisFailure;

// ─────────────────────────────────────────────────────────────────────────────
// § 3 — ERROR CLASS (backward compat)
// ─────────────────────────────────────────────────────────────────────────────

export type ATSAnalysisErrorKind =
  | "empty_input"
  | "all_models_exhausted"
  | "validation_failed"
  | "provider_error";

export class ATSAnalysisError extends Error {
  readonly kind: ATSAnalysisErrorKind;
  readonly attemptLog: AttemptRecord[];
  readonly traceId: string | undefined;

  constructor(
    kind: ATSAnalysisErrorKind,
    message: string,
    attemptLog: AttemptRecord[],
    traceId?: string
  ) {
    super(message);
    this.name = "ATSAnalysisError";
    this.kind = kind;
    this.attemptLog = attemptLog;
    this.traceId = traceId;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4 — SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `\
You are an expert ATS (Applicant Tracking System) analyzer with deep knowledge of how ATS systems parse, rank, and filter resumes.

Given a parsed resume and a job description, provide a detailed ATS compatibility analysis.

SCORING:
- 80-100: Excellent — strong ATS pass probability, well-aligned candidate
- 60-79:  Good — likely to pass ATS with minor optimizations
- 40-59:  Moderate — meaningful gaps, keyword optimization needed
- 0-39:   Poor — significant misalignment with the role

RULES:
1. Match keywords case-insensitively. Include both hard skills and soft skills.
2. Recommendations must be specific and actionable:
   ✓ "Add 'Kubernetes' to your Skills section"
   ✗ "Add more cloud skills"
3. Strengths: concrete positives for this specific role (not generic praise).
4. Weaknesses: specific ATS-hurting gaps (missing keywords, formatting issues, unclear titles).
5. Return valid JSON conforming exactly to the provided schema.`;

// ─────────────────────────────────────────────────────────────────────────────
// § 5 — INPUT SERIALIZER
// ─────────────────────────────────────────────────────────────────────────────

function buildAnalysisPrompt(input: ATSAnalysisInput): string {
  const { parsedResume, jobDescription, targetRole } = input;
  const pi = parsedResume.personalInfo;

  const resumeSection = [
    targetRole ? `Target Role: ${targetRole}` : "",
    `Current Title: ${pi.jobTitle}`,
    `Location: ${pi.location}`,
    parsedResume.summary ? `\nSummary: ${parsedResume.summary}` : "",
    `\nSkills: ${parsedResume.skills.join(", ")}`,
    parsedResume.workExperience.length > 0
      ? "\nExperience:\n" +
        parsedResume.workExperience
          .slice(0, 4) // top 4 most recent roles
          .map((e) => `- ${e.title} at ${e.company} (${e.startDate}–${e.endDate})`)
          .join("\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const jd = truncateToTokens(jobDescription, 900); // ≈ 3 420 chars

  return `RESUME:\n${resumeSection}\n\n---\n\nJOB DESCRIPTION:\n${jd}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6 — ATS ANALYSIS AGENT
// ─────────────────────────────────────────────────────────────────────────────

export class ATSAnalysisAgent {
  private readonly chain: readonly ModelId[];

  constructor() {
    this.chain = TASK_ROUTES.atsAnalysis.chain;
  }

  async run(input: ATSAnalysisInput): Promise<ATSAnalysisResult> {
    if (!input.parsedResume || !input.jobDescription?.trim()) {
      const error = new ATSAnalysisError("empty_input", "parsedResume and jobDescription are required.", [], input.traceId);
      return { success: false, error, attemptCount: 0, durationMs: 0, attemptLog: [] };
    }

    const prompt = buildAnalysisPrompt(input);

    const result = await runWithRetry(
      this.chain,
      (modelId) =>
        generateObject({
          model: buildOpenRouterModel(modelId),
          schema: ATSAnalysisOutputSchema,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
          maxOutputTokens: 2_000,
          maxRetries: 0,
        }),
      "ATSAnalysisAgent",
      input.traceId
    );

    if (result.success) return result;

    const log = adaptAttemptLog(result.attemptLog);
    return {
      success: false,
      error: new ATSAnalysisError(result.errorKind, result.errorMessage, log, input.traceId),
      attemptCount: result.attemptCount,
      durationMs: result.durationMs,
      attemptLog: log,
    };
  }

  async runAsNode(state: PipelineState): Promise<Partial<PipelineState>> {
    if (!state.parsedResume) {
      return appendError(state, "atsAnalysisNode", "parsedResume is not set.");
    }
    if (!state.jobDescription?.trim()) {
      return appendError(state, "atsAnalysisNode", "jobDescription is not set.");
    }

    const result = await this.run({
      parsedResume: state.parsedResume,
      jobDescription: state.jobDescription,
      targetRole: state.targetRole,
      traceId: state.currentNode,
    });

    if (!result.success) {
      const log = result.attemptLog.map((a) => `${a.modelId}(${a.errorKind})`).join(" → ");
      return appendError(state, "atsAnalysisNode", result.error.message + (log ? ` | ${log}` : ""));
    }

    return { atsAnalysis: result.data };
  }
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

export const atsAnalysisAgent = new ATSAnalysisAgent();

export const atsAnalysisNode: NodeFn = (state) => atsAnalysisAgent.runAsNode(state);

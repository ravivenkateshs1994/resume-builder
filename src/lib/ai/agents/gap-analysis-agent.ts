/**
 * GapAnalysisAgent
 *
 * Performs deep skill gap analysis between a candidate's current skill profile
 * and a target role using generateObject + DeepSeek R1.
 *
 * Bug fixed in this version: runAsNode now correctly prefers state.normalizedSkills
 * (the canonicalized post-normalization output) over state.enrichedSkills and
 * state.resumeSkills, ensuring the normalization stage is not bypassed.
 *
 * Server-only. Never import from client components.
 */

import { generateObject } from "ai";
import { z } from "zod";
import { TASK_ROUTES, type ModelId } from "../model-router";
import type { PipelineState, PipelineError } from "../graphs/state";
import type { NodeFn } from "../graphs/nodes";
import type { SkillExtractionOutput } from "../schemas/skills";
import type { SkillExtractionAgentOutput } from "./skill-extraction-agent";
import type { NormalizedSkillInventory } from "./skill-normalization-agent";
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

const GapEntrySchema = z.object({
  skill: z.string().describe("Canonical skill name"),
  category: z.string().describe("Skill category: technical, framework, tool, cloud, database, soft"),
  currentLevel: z
    .enum(["none", "beginner", "intermediate", "advanced", "expert"])
    .describe("Candidate's current proficiency level"),
  requiredLevel: z
    .enum(["none", "beginner", "intermediate", "advanced", "expert"])
    .describe("Level required for the target role"),
  learningPath: z.string().describe("Specific, practical resource or approach to close this gap"),
  estimatedWeeks: z.number().describe("Realistic weeks to close gap at 2-10 hrs/week"),
});

const MarketDemandEntrySchema = z.object({
  skill: z.string().describe("Skill name"),
  demandLevel: z
    .enum(["critical", "high", "medium", "low"])
    .describe("How frequently this skill appears in similar job postings"),
  marketContext: z.string().describe("Brief note on why this skill matters for the target role"),
});

export const GapAnalysisAgentOutputSchema = z.object({
  strengths: z.array(z.string()).describe("Skills where the candidate meets or exceeds role requirements"),
  gaps: z.array(GapEntrySchema).describe("All skill gaps ordered by impact on hiring"),
  criticalGaps: z.array(GapEntrySchema).describe("Must-have skills that would immediately disqualify the candidate"),
  marketDemand: z.array(MarketDemandEntrySchema).describe("Top skills for this role with demand context"),
  recommendations: z.array(z.string()).describe("Prioritized, specific recommendations to improve candidacy"),
  readinessScore: z.number().min(0).max(100).describe("Current readiness for the target role 0-100"),
  estimatedTimeToReady: z.number().describe("Realistic total weeks to reach hiring-ready level"),
  summary: z.string().describe("2-3 sentence executive summary of gap analysis"),
});

export type GapAnalysisAgentOutput = z.infer<typeof GapAnalysisAgentOutputSchema>;
export type GapEntry = z.infer<typeof GapEntrySchema>;
export type MarketDemandEntry = z.infer<typeof MarketDemandEntrySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// § 2 — INPUT / RESULT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface GapAnalysisAgentInput {
  currentSkills: NormalizedSkillInventory | SkillExtractionAgentOutput | SkillExtractionOutput;
  targetRole: string;
  atsScore?: number;
  traceId?: string;
}

interface AttemptRecord {
  attempt: number;
  modelId: ModelId;
  errorKind: "retryable" | "advance_model";
  message: string;
  durationMs: number;
}

export type GapAnalysisAgentSuccess = AgentRunSuccess<GapAnalysisAgentOutput>;

export interface GapAnalysisAgentFailure {
  success: false;
  error: GapAnalysisAgentError;
  attemptCount: number;
  durationMs: number;
  attemptLog: AttemptRecord[];
}

export type GapAnalysisAgentResult = GapAnalysisAgentSuccess | GapAnalysisAgentFailure;

// ─────────────────────────────────────────────────────────────────────────────
// § 3 — ERROR CLASS (backward compat)
// ─────────────────────────────────────────────────────────────────────────────

export type GapAnalysisAgentErrorKind =
  | "empty_input"
  | "all_models_exhausted"
  | "validation_failed"
  | "provider_error";

export class GapAnalysisAgentError extends Error {
  readonly kind: GapAnalysisAgentErrorKind;
  readonly attemptLog: AttemptRecord[];
  readonly traceId: string | undefined;

  constructor(
    kind: GapAnalysisAgentErrorKind,
    message: string,
    attemptLog: AttemptRecord[],
    traceId?: string
  ) {
    super(message);
    this.name = "GapAnalysisAgentError";
    this.kind = kind;
    this.attemptLog = attemptLog;
    this.traceId = traceId;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4 — SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `\
You are a senior career strategist and technical skills expert specializing in skill gap analysis.

Given a candidate's current skill profile and target role, provide a deep, actionable gap analysis.

RULES:
1. Be specific — name exact skills, not vague categories.
2. Proficiency levels: "none" | "beginner" | "intermediate" | "advanced" | "expert"
3. learningPath: specific and practical — name courses, certifications, or project types.
   ✓ "Complete AWS Solutions Architect Associate on A Cloud Guru (~40 hrs)"
   ✗ "Learn cloud computing"
4. estimatedWeeks: realistic at 2-10 hrs/week self-study.
5. criticalGaps: skills explicitly required in the role that are completely absent from the profile.
6. readinessScore: 0=not ready at all, 100=ready to interview today.
7. estimatedTimeToReady: total weeks to become a competitive applicant.
8. Return valid JSON conforming exactly to the provided schema.`;

// ─────────────────────────────────────────────────────────────────────────────
// § 5 — INPUT SERIALIZER
// ─────────────────────────────────────────────────────────────────────────────

type AnySkillData = NormalizedSkillInventory | SkillExtractionAgentOutput | SkillExtractionOutput;

function serializeSkillsForGap(skills: AnySkillData, targetRole: string, atsScore?: number): string {
  const lines: string[] = [`Target Role: ${targetRole}`];
  if (atsScore !== undefined) lines.push(`ATS Score: ${atsScore}/100`);
  lines.push("\n## Current Skill Profile");

  if ("technicalSkills" in skills) {
    // NormalizedSkillInventory | SkillExtractionAgentOutput (same type)
    if (skills.technicalSkills?.length) {
      lines.push(
        "\n### Technical Skills\n" +
          skills.technicalSkills
            .map((s) => `- ${s.name} (${s.proficiencySignal}${s.yearsEvidence ? `, ${s.yearsEvidence}y` : ""})`)
            .join("\n")
      );
    }
    if (skills.frameworks?.length) {
      lines.push("\n### Frameworks\n" + skills.frameworks.map((s) => `- ${s.name}`).join("\n"));
    }
    if (skills.tools?.length) {
      lines.push("\n### Tools\n" + skills.tools.map((s) => `- ${s.name}`).join("\n"));
    }
    if (skills.cloudPlatforms?.length) {
      lines.push("\n### Cloud Platforms\n" + skills.cloudPlatforms.map((s) => `- ${s.name}`).join("\n"));
    }
    if (skills.databases?.length) {
      lines.push("\n### Databases\n" + skills.databases.map((s) => `- ${s.name}`).join("\n"));
    }
    if (skills.certifications?.length) {
      lines.push("\n### Certifications\n" + (skills.certifications as string[]).map((c) => `- ${c}`).join("\n"));
    }
    if (skills.softSkills?.length) {
      lines.push("\n### Soft Skills\n" + skills.softSkills.join(", "));
    }
    if (skills.senioritySummary) {
      lines.push(`\n### Seniority Assessment\n${skills.senioritySummary}`);
    }
  } else {
    // SkillExtractionOutput (flat format)
    if (skills.skills?.length) lines.push(`\n### Skills\n${skills.skills.join(", ")}`);
    if (skills.technologies?.length) lines.push(`\n### Technologies\n${skills.technologies.join(", ")}`);
    if (skills.frameworks?.length) lines.push(`\n### Frameworks\n${skills.frameworks.join(", ")}`);
    if (skills.tools?.length) lines.push(`\n### Tools\n${skills.tools.join(", ")}`);
    if (skills.certifications?.length) lines.push(`\n### Certifications\n${skills.certifications.join(", ")}`);
    if (skills.methodologies?.length) lines.push(`\n### Methodologies\n${skills.methodologies.join(", ")}`);
    if (skills.softSkills?.length) lines.push(`\n### Soft Skills\n${skills.softSkills.join(", ")}`);
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6 — GAP ANALYSIS AGENT
// ─────────────────────────────────────────────────────────────────────────────

export class GapAnalysisAgent {
  private readonly chain: readonly ModelId[];

  constructor() {
    this.chain = TASK_ROUTES.gapAnalysis.chain;
  }

  async run(input: GapAnalysisAgentInput): Promise<GapAnalysisAgentResult> {
    if (!input.targetRole?.trim()) {
      const error = new GapAnalysisAgentError("empty_input", "targetRole is required.", [], input.traceId);
      return { success: false, error, attemptCount: 0, durationMs: 0, attemptLog: [] };
    }

    const raw = serializeSkillsForGap(input.currentSkills, input.targetRole, input.atsScore);
    const text = truncateToTokens(raw, 1_500); // ≈ 5 700 chars

    const result = await runWithRetry(
      this.chain,
      (modelId) =>
        generateObject({
          model: buildOpenRouterModel(modelId),
          schema: GapAnalysisAgentOutputSchema,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: text }],
          temperature: 0,
          maxOutputTokens: 4_000,
          maxRetries: 0,
        }),
      "GapAnalysisAgent",
      input.traceId
    );

    if (result.success) return result;

    const log = adaptAttemptLog(result.attemptLog);
    return {
      success: false,
      error: new GapAnalysisAgentError(result.errorKind, result.errorMessage, log, input.traceId),
      attemptCount: result.attemptCount,
      durationMs: result.durationMs,
      attemptLog: log,
    };
  }

  async runAsNode(state: PipelineState): Promise<Partial<PipelineState>> {
    // ── BUG FIX: prefer normalizedSkills (post-normalization) over raw extraction outputs
    const currentSkills =
      state.normalizedSkills ?? state.enrichedSkills ?? state.resumeSkills;

    if (!currentSkills) {
      return appendError(state, "gapAnalysisNode", "No skill data available (normalizedSkills, enrichedSkills, resumeSkills are all unset).");
    }
    if (!state.targetRole?.trim()) {
      return appendError(state, "gapAnalysisNode", "targetRole is not set.");
    }

    const result = await this.run({
      currentSkills,
      targetRole: state.targetRole,
      atsScore: state.atsAnalysis?.score,
      traceId: state.currentNode,
    });

    if (!result.success) {
      const log = result.attemptLog.map((a) => `${a.modelId}(${a.errorKind})`).join(" → ");
      return appendError(state, "gapAnalysisNode", result.error.message + (log ? ` | ${log}` : ""));
    }

    return { skillGapAnalysis: result.data };
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

export const gapAnalysisAgentInstance = new GapAnalysisAgent();

export const gapAnalysisAgentNode: NodeFn = (state) => gapAnalysisAgentInstance.runAsNode(state);

/**
 * RoadmapGeneratorAgent
 *
 * Generates a time-phased career development roadmap from a skill gap analysis
 * using generateObject + DeepSeek R1.
 *
 * Server-only. Never import from client components.
 */

import { generateObject } from "ai";
import { z } from "zod";
import { TASK_ROUTES, type ModelId } from "../model-router";
import type { PipelineState, PipelineError } from "../graphs/state";
import type { NodeFn } from "../graphs/nodes";
import type { GapAnalysisAgentOutput } from "./gap-analysis-agent";
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

const ActionItemSchema = z.object({
  action: z.string().describe("Concrete action to take this week"),
  reason: z.string().describe("Why this action is the highest-priority right now"),
  dueDate: z.string().optional().describe("Optional ISO date (YYYY-MM-DD) for this action"),
});

const PhasePlanSchema = z.object({
  theme: z.string().describe("Focus theme for this phase (e.g. 'Foundation Building')"),
  goals: z.array(z.string()).describe("3-5 concrete, measurable goals for this phase"),
  milestones: z.array(z.string()).describe("Specific deliverables that signal phase completion"),
  resources: z.array(z.string()).describe("Named resources: courses, books, certs with platform names"),
});

export const RoadmapGeneratorOutputSchema = z.object({
  immediateActions: z.array(ActionItemSchema).describe("3-5 things to do this week"),
  thirtyDayPlan: PhasePlanSchema.describe("30-day plan"),
  sixtyDayPlan: PhasePlanSchema.describe("60-day plan"),
  ninetyDayPlan: PhasePlanSchema.describe("90-day plan"),
  sixMonthPlan: PhasePlanSchema.describe("6-month plan"),
  targetReadinessDate: z.string().describe("Projected hiring-ready date in YYYY-MM-DD format"),
  weeklyTimeCommitment: z.number().describe("Recommended study hours per week"),
  keyRisks: z.array(z.string()).describe("Real risks that could derail this plan"),
  successMetrics: z.array(z.string()).describe("Measurable signals the candidate is on track"),
});

export type RoadmapGeneratorOutput = z.infer<typeof RoadmapGeneratorOutputSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// § 2 — INPUT / RESULT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface RoadmapGeneratorInput {
  skillGapAnalysis: GapAnalysisAgentOutput;
  targetRole: string;
  traceId?: string;
}

interface AttemptRecord {
  attempt: number;
  modelId: ModelId;
  errorKind: "retryable" | "advance_model";
  message: string;
  durationMs: number;
}

export type RoadmapGeneratorSuccess = AgentRunSuccess<RoadmapGeneratorOutput>;

export interface RoadmapGeneratorFailure {
  success: false;
  error: RoadmapGeneratorError;
  attemptCount: number;
  durationMs: number;
  attemptLog: AttemptRecord[];
}

export type RoadmapGeneratorResult = RoadmapGeneratorSuccess | RoadmapGeneratorFailure;

// ─────────────────────────────────────────────────────────────────────────────
// § 3 — ERROR CLASS (backward compat)
// ─────────────────────────────────────────────────────────────────────────────

export type RoadmapGeneratorErrorKind = "empty_input" | "all_models_exhausted" | "provider_error";
export type ActionItem = z.infer<typeof ActionItemSchema>;
export type PhasePlan = z.infer<typeof PhasePlanSchema>;

export class RoadmapGeneratorError extends Error {
  readonly attemptLog: AttemptRecord[];
  readonly traceId: string | undefined;

  constructor(message: string, attemptLog: AttemptRecord[], traceId?: string) {
    super(message);
    this.name = "RoadmapGeneratorError";
    this.attemptLog = attemptLog;
    this.traceId = traceId;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4 — SYSTEM PROMPT
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `\
You are an expert career coach specializing in actionable, time-bound career development roadmaps.

Given a skill gap analysis and target role, create a realistic, phased development roadmap.

RULES:
1. immediateActions: 3-5 things to do THIS WEEK (update LinkedIn, start a specific course, reach out to network).
2. Phase plans (30/60/90 day, 6 month): concrete milestones with specific deliverables, not vague goals.
3. resources: name specific resources with platform:
   ✓ "AWS Solutions Architect Associate — A Cloud Guru (40 hrs)"
   ✗ "Take an AWS course"
4. weeklyTimeCommitment: be honest. If the gap is large, say so (e.g. 15 hrs/week).
5. targetReadinessDate: ISO date in YYYY-MM-DD format based on today's date + estimatedTimeToReady.
6. keyRisks: real, specific risks — not generic platitudes.
7. successMetrics: measurable signals (portfolio project count, interview callback rate, certification earned).
8. Return valid JSON conforming exactly to the provided schema.`;

// ─────────────────────────────────────────────────────────────────────────────
// § 5 — INPUT SERIALIZER
// ─────────────────────────────────────────────────────────────────────────────

function buildRoadmapPrompt(input: RoadmapGeneratorInput): string {
  const { skillGapAnalysis: gap, targetRole } = input;

  const lines = [
    `Target Role: ${targetRole}`,
    `Readiness Score: ${gap.readinessScore}/100`,
    `Estimated Weeks to Ready: ${gap.estimatedTimeToReady}`,
    `\nSummary: ${gap.summary}`,
  ];

  if (gap.strengths.length > 0) {
    lines.push(`\n## Strengths\n${gap.strengths.map((s) => `- ${s}`).join("\n")}`);
  }

  if (gap.criticalGaps.length > 0) {
    lines.push(
      "\n## Critical Gaps\n" +
        gap.criticalGaps
          .map((g) => `- ${g.skill}: ${g.currentLevel} → ${g.requiredLevel} (~${g.estimatedWeeks}w)`)
          .join("\n")
    );
  }

  if (gap.gaps.length > 0) {
    lines.push(
      "\n## Skill Gaps\n" +
        gap.gaps
          .slice(0, 12) // top 12 to stay within token budget
          .map((g) => `- ${g.skill}: ${g.currentLevel} → ${g.requiredLevel} | ${g.learningPath} (~${g.estimatedWeeks}w)`)
          .join("\n")
    );
  }

  if (gap.recommendations.length > 0) {
    lines.push(`\n## Recommendations\n${gap.recommendations.map((r) => `- ${r}`).join("\n")}`);
  }

  return truncateToTokens(lines.join("\n"), 1_500); // ≈ 5 700 chars
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6 — ROADMAP GENERATOR AGENT
// ─────────────────────────────────────────────────────────────────────────────

export class RoadmapGeneratorAgent {
  private readonly chain: readonly ModelId[];

  constructor() {
    this.chain = TASK_ROUTES.roadmapGeneration.chain;
  }

  async run(input: RoadmapGeneratorInput): Promise<RoadmapGeneratorResult> {
    if (!input.targetRole?.trim() || !input.skillGapAnalysis) {
      const error = new RoadmapGeneratorError("skillGapAnalysis and targetRole are required.", [], input.traceId);
      return { success: false, error, attemptCount: 0, durationMs: 0, attemptLog: [] };
    }

    const prompt = buildRoadmapPrompt(input);

    const result = await runWithRetry(
      this.chain,
      (modelId) =>
        generateObject({
          model: buildOpenRouterModel(modelId),
          schema: RoadmapGeneratorOutputSchema,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1, // slight creativity for plan variety
          maxOutputTokens: 5_000,
          maxRetries: 0,
        }),
      "RoadmapGeneratorAgent",
      input.traceId
    );

    if (result.success) return result;

    const log = adaptAttemptLog(result.attemptLog);
    return {
      success: false,
      error: new RoadmapGeneratorError(result.errorMessage, log, input.traceId),
      attemptCount: result.attemptCount,
      durationMs: result.durationMs,
      attemptLog: log,
    };
  }

  async runAsNode(state: PipelineState): Promise<Partial<PipelineState>> {
    if (!state.skillGapAnalysis) {
      return appendError(state, "generateRoadmapNode", "skillGapAnalysis is not set.");
    }
    if (!state.targetRole?.trim()) {
      return appendError(state, "generateRoadmapNode", "targetRole is not set.");
    }

    const result = await this.run({
      skillGapAnalysis: state.skillGapAnalysis,
      targetRole: state.targetRole,
      traceId: state.currentNode,
    });

    if (!result.success) {
      const log = result.attemptLog.map((a) => `${a.modelId}(${a.errorKind})`).join(" → ");
      return appendError(state, "generateRoadmapNode", result.error.message + (log ? ` | ${log}` : ""));
    }

    return { careerRoadmap: result.data };
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

export const roadmapGeneratorAgent = new RoadmapGeneratorAgent();

export const roadmapGeneratorNode: NodeFn = (state) => roadmapGeneratorAgent.runAsNode(state);

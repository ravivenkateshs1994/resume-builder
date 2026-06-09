import type { ModelId, TaskName } from "./types";

// ── Environment variable bindings ─────────────────────────────────────────────
// Evaluated at call-time (not module load) so Next.js edge/server environments
// with deferred env injection work correctly.

function readEnvModel(key: string): ModelId | undefined {
  const value = process.env[key]?.trim();
  return value ? (value as ModelId) : undefined;
}

function buildEnvMap(): Partial<Record<TaskName, ModelId>> {
  return {
    resumeParse: readEnvModel("OPENROUTER_RESUME_INTELLIGENCE_MODEL"),
    skillExtraction: readEnvModel("OPENROUTER_RESUME_INTELLIGENCE_MODEL"),
    atsAnalysis: readEnvModel("OPENROUTER_ATS_MODEL"),
    gapAnalysis: readEnvModel("OPENROUTER_GAP_ANALYSIS_MODEL"),
    roadmapGeneration: readEnvModel("OPENROUTER_ROADMAP_MODEL"),
    careerCoach: readEnvModel("OPENROUTER_CAREER_COPILOT_MODEL"),
    interviewPrep: readEnvModel("OPENROUTER_INTERVIEW_MODEL"),
    fallback: readEnvModel("OPENROUTER_FALLBACK_MODEL"),
  };
}

// ── Hardcoded defaults (authoritative per-task models from architecture spec) ──

const DEFAULTS: Record<TaskName, ModelId> = {
  resumeParse: "qwen/qwen3-235b-a22b-2507",
  skillExtraction: "qwen/qwen3-235b-a22b-2507",
  atsAnalysis: "deepseek/deepseek-r1",
  gapAnalysis: "deepseek/deepseek-r1",
  roadmapGeneration: "deepseek/deepseek-r1",
  careerCoach: "deepseek/deepseek-r1",
  interviewPrep: "qwen/qwen3-32b",
  fallback: "meta-llama/llama-4-maverick",
};

// ── Public routing API ────────────────────────────────────────────────────────

/**
 * Resolves the model ID for a task using priority:
 * 1. Explicit override (from caller)
 * 2. Environment variable (from .env.local)
 * 3. Hardcoded architecture default
 */
export function resolveModel(task: TaskName, override?: string): ModelId {
  const trimmed = override?.trim();
  if (trimmed) return trimmed as ModelId;

  return buildEnvMap()[task] ?? DEFAULTS[task];
}

/**
 * Returns [primaryModel, fallbackModel] for resilient completion calls.
 */
export function resolveModelWithFallback(
  task: TaskName,
  override?: string
): [primary: ModelId, fallback: ModelId] {
  return [resolveModel(task, override), resolveModel("fallback")];
}

/**
 * Returns the full routing table for observability / debugging.
 */
export function getRoutingTable(): Record<TaskName, ModelId> {
  const envMap = buildEnvMap();
  const tasks = Object.keys(DEFAULTS) as TaskName[];
  return Object.fromEntries(
    tasks.map((task) => [task, envMap[task] ?? DEFAULTS[task]])
  ) as Record<TaskName, ModelId>;
}

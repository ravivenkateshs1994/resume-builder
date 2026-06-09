import type { TaskName } from "../models/types";

// ── Agent Contract ────────────────────────────────────────────────────────────

/**
 * A typed, single-responsibility AI agent.
 * Each agent wraps exactly one service call and adds input validation,
 * error handling, and structured observability.
 */
export interface Agent<TInput, TOutput> {
  readonly name: string;
  readonly task: TaskName;
  readonly description: string;
  run(input: TInput): Promise<AgentResult<TOutput>>;
}

// ── Result Envelope ───────────────────────────────────────────────────────────

export type AgentResult<T> =
  | { success: true; data: T; durationMs: number; modelUsed?: string }
  | { success: false; error: string; durationMs: number; modelUsed?: string };

// ── Agent Run Helper ──────────────────────────────────────────────────────────

/**
 * Wraps an async service call with timing, error catching, and structured result.
 */
export async function runAgent<T>(
  fn: () => Promise<T | null>,
  modelUsed?: string
): Promise<AgentResult<T>> {
  const start = Date.now();
  try {
    const data = await fn();
    const durationMs = Date.now() - start;

    if (data === null) {
      return {
        success: false,
        error: "Service returned null — model output could not be parsed.",
        durationMs,
        modelUsed,
      };
    }

    return { success: true, data, durationMs, modelUsed };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
      modelUsed,
    };
  }
}

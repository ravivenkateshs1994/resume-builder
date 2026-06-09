/**
 * Shared agent utilities for the Career Readiness Platform AI layer.
 *
 * Eliminates ~500 lines of duplication across the 5 production agents by
 * providing a single, well-tested implementation of:
 *
 *  • Structured logger with correlation IDs and JSON-serializable entries
 *  • Error classifier (rate-limit, context, unavailable, network, unknown)
 *  • Generic retry engine with model-advance failover
 *  • OpenRouter provider factory (module-level singleton, instantiated once)
 *  • Token-aware text truncation (char heuristic: 1 token ≈ 3.8 chars)
 *  • Warning formatter for Vercel AI SDK SharedV3Warning union
 *
 * Server-only. Never import from client components.
 */

import {
  wrapLanguageModel,
  extractReasoningMiddleware,
  NoObjectGeneratedError,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { ModelId } from "../model-router";

// ─────────────────────────────────────────────────────────────────────────────
// § 1 — STRUCTURED LOGGER
// ─────────────────────────────────────────────────────────────────────────────

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  ts: string;
  agent: string;
  event: string;
  traceId?: string;
  durationMs?: number;
  data?: Record<string, unknown>;
}

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Structured logger for AI agents.
 *
 * In production → JSON lines to stderr (machine-parseable, compatible with
 * Datadog, CloudWatch, Vercel Log Drain).
 *
 * In development → readable console output.
 */
export const aiLog = (
  level: LogLevel,
  agent: string,
  event: string,
  meta?: { traceId?: string; durationMs?: number; data?: Record<string, unknown> }
): void => {
  // Skip debug in production
  if (IS_PROD && level === "debug") return;

  const entry: LogEntry = {
    level,
    ts: new Date().toISOString(),
    agent,
    event,
    ...(meta?.traceId && { traceId: meta.traceId }),
    ...(meta?.durationMs !== undefined && { durationMs: meta.durationMs }),
    ...(meta?.data && { data: meta.data }),
  };

  if (IS_PROD) {
    // JSON line to stderr — do not use console.log which goes to stdout
    process.stderr.write(JSON.stringify(entry) + "\n");
    return;
  }

  // Dev: readable format
  const prefix = `[${entry.level.toUpperCase()}] [${agent}]`;
  const suffix = meta?.traceId ? ` (trace:${meta.traceId})` : "";
  const dur = meta?.durationMs !== undefined ? ` +${meta.durationMs}ms` : "";
  const line = `${prefix} ${event}${suffix}${dur}`;

  switch (level) {
    case "debug":
      console.debug(line, meta?.data ?? "");
      break;
    case "info":
      console.info(line, meta?.data ?? "");
      break;
    case "warn":
      console.warn(line, meta?.data ?? "");
      break;
    case "error":
      console.error(line, meta?.data ?? "");
      break;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// § 2 — PROVIDER SINGLETON
// Instantiated once per process to avoid repeated allocations.
// ─────────────────────────────────────────────────────────────────────────────

let _provider: ReturnType<typeof createOpenAI> | null = null;
/** Last key used to build the provider — detects key rotation between calls. */
let _providerKey = "";

function getProvider(): ReturnType<typeof createOpenAI> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "[AI Layer] OPENROUTER_API_KEY environment variable is not set. " +
        "Add it to .env.local for development or to your deployment environment."
    );
  }

  // Rebuild if singleton is absent or key has changed (e.g. key rotation).
  if (_provider && _providerKey === apiKey) return _provider;

  _provider = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    headers: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000",
      "X-Title": "Career Readiness Platform",
    },
  });
  _providerKey = apiKey;

  return _provider;
}

/**
 * Clears the provider singleton. Call this after a known auth failure to
 * force re-initialisation with a fresh key on the next request.
 * @internal — exposed for testing and key-rotation recovery only.
 */
export function _resetProviderSingleton(): void {
  _provider = null;
  _providerKey = "";
}

/**
 * Build an OpenRouter-backed language model for a given model ID.
 * Wraps with `extractReasoningMiddleware` to strip `<think>…</think>` blocks
 * emitted by DeepSeek-R1 and Qwen3 thinking models before Zod validation.
 */
export function buildOpenRouterModel(modelId: ModelId) {
  return wrapLanguageModel({
    model: getProvider()(modelId),
    middleware: extractReasoningMiddleware({ tagName: "think", separator: "\n" }),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3 — ERROR CLASSIFIER
// ─────────────────────────────────────────────────────────────────────────────

export type RetryPolicy = "retryable" | "advance_model";

export interface ErrorClassification {
  policy: RetryPolicy;
  /** Milliseconds to wait before the next attempt (0 = immediate). */
  delayMs: number;
}

const BASE_BACKOFF_MS = 1_000;
/** Milliseconds to pause before hitting the next model after a rate-limit advance. */
const MODEL_ADVANCE_DELAY_MS = 300;

/**
 * Adds ±35% random jitter to a backoff delay to reduce thundering herd
 * when multiple concurrent requests hit the same rate-limited endpoint.
 */
function withJitter(ms: number): number {
  // multiply by [0.65, 1.35]
  return Math.max(0, Math.floor(ms * (0.65 + Math.random() * 0.7)));
}

/**
 * Classify an error from a `generateObject` / `generateText` call into a
 * retry policy. The `attempt` parameter (0-based) controls backoff magnitude.
 */
export function classifyError(err: unknown, attempt: number): ErrorClassification {
  const backoff = BASE_BACKOFF_MS * 2 ** attempt;

  // SDK: model produced output but failed schema validation
  if (err instanceof NoObjectGeneratedError) {
    return { policy: "advance_model", delayMs: 0 };
  }

  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();

  // Rate limit / quota → advance to next model immediately
  if (
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("quota")
  ) {
    return { policy: "advance_model", delayMs: 0 };
  }

  // Model unavailable / not found → advance
  if (
    lower.includes("no endpoint") ||
    lower.includes("no provider") ||
    lower.includes("model not found") ||
    lower.includes("not available") ||
    lower.includes("unavailable") ||
    lower.includes("404") ||
    lower.includes("403")
  ) {
    return { policy: "advance_model", delayMs: 0 };
  }

  // Context window exceeded → advance (same model cannot handle this)
  if (
    lower.includes("context length") ||
    lower.includes("context_length_exceeded") ||
    lower.includes("maximum context") ||
    lower.includes("token limit")
  ) {
    return { policy: "advance_model", delayMs: 0 };
  }

  // Transient network errors → retry same model with backoff
  if (
    lower.includes("timeout") ||
    lower.includes("etimedout") ||
    lower.includes("timed out") ||
    lower.includes("econnreset") ||
    lower.includes("econnrefused") ||
    lower.includes("network") ||
    lower.includes("aborted")
  ) {
    return { policy: "retryable", delayMs: backoff };
  }

  // Unknown → give it one retry with backoff
  return { policy: "retryable", delayMs: backoff };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4 — GENERIC RETRY ENGINE
// ─────────────────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 3;

export interface AgentAttemptRecord {
  attempt: number;
  modelId: ModelId;
  policy: RetryPolicy;
  message: string;
  durationMs: number;
}

export interface AgentUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface AgentRunSuccess<T> {
  success: true;
  data: T;
  modelUsed: ModelId;
  attemptCount: number;
  durationMs: number;
  usage: AgentUsage;
  warnings: string[];
}

export interface AgentRunFailure {
  success: false;
  errorMessage: string;
  errorKind: "all_models_exhausted" | "empty_input" | "provider_error";
  attemptCount: number;
  durationMs: number;
  attemptLog: AgentAttemptRecord[];
}

export type AgentRunResult<T> = AgentRunSuccess<T> | AgentRunFailure;

/**
 * Generic AI agent retry engine with model-advance failover.
 *
 * Walks the `chain` until a `generate` call succeeds, advancing to the next
 * model on hard failures (rate-limit, unavailable, context exceeded, schema
 * validation) and backing off on transient network errors.
 *
 * @param chain    Ordered model failover chain from `TASK_ROUTES`
 * @param generate Async function that calls `generateObject` for a given model
 * @param agent    Agent name for structured log entries
 * @param traceId  Optional correlation ID propagated to log entries
 */
export async function runWithRetry<T>(
  chain: readonly ModelId[],
  generate: (modelId: ModelId) => Promise<{
    object: T;
    usage?: { inputTokens?: number; outputTokens?: number };
    warnings?: Array<{ type: string; feature?: string; message?: string }>;
  }>,
  agent: string,
  traceId?: string
): Promise<AgentRunResult<T>> {
  const globalStart = Date.now();
  const attemptLog: AgentAttemptRecord[] = [];
  let chainIndex = 0;
  let consecutiveRetries = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const modelId = chain[Math.min(chainIndex, chain.length - 1)];
    const attemptStart = Date.now();

    try {
      const result = await generate(modelId);
      const durationMs = Date.now() - globalStart;
      const inputTokens = result.usage?.inputTokens ?? 0;
      const outputTokens = result.usage?.outputTokens ?? 0;

      aiLog("info", agent, "attempt_succeeded", {
        traceId,
        durationMs,
        data: { modelId, attempt: attempt + 1, inputTokens, outputTokens },
      });

      return {
        success: true,
        data: result.object,
        modelUsed: modelId,
        attemptCount: attempt + 1,
        durationMs,
        usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
        warnings: mapWarnings(result.warnings),
      };
    } catch (err) {
      const attemptDurationMs = Date.now() - attemptStart;
      const { policy, delayMs } = classifyError(err, consecutiveRetries);
      const message = err instanceof Error ? err.message : String(err);

      attemptLog.push({
        attempt: attempt + 1,
        modelId,
        policy,
        message,
        durationMs: attemptDurationMs,
      });

      aiLog("warn", agent, "attempt_failed", {
        traceId,
        durationMs: attemptDurationMs,
        data: {
          attempt: attempt + 1,
          maxAttempts: MAX_ATTEMPTS,
          modelId,
          policy,
          error: message.slice(0, 300),
        },
      });

      if (attempt === MAX_ATTEMPTS - 1) break;

      if (policy === "advance_model") {
        const nextIndex = Math.min(chainIndex + 1, chain.length - 1);
        if (nextIndex !== chainIndex) {
          // Genuinely advanced to a new model — reset counter, brief pause to
          // avoid immediately rate-limiting the next model too.
          chainIndex = nextIndex;
          consecutiveRetries = 0;
          await sleep(MODEL_ADVANCE_DELAY_MS);
        } else {
          // Chain exhausted — stuck at last model. Treat as retryable with
          // proper exponential backoff + jitter (do NOT reset consecutiveRetries).
          consecutiveRetries += 1;
          await sleep(withJitter(BASE_BACKOFF_MS * 2 ** consecutiveRetries));
        }
      } else {
        // Retryable (network / timeout) — backoff the same model with jitter.
        consecutiveRetries += 1;
        await sleep(withJitter(delayMs));
      }
    }
  }

  const durationMs = Date.now() - globalStart;

  aiLog("error", agent, "all_attempts_failed", {
    traceId,
    durationMs,
    data: {
      attemptLog: attemptLog.map((a) => `${a.modelId}(${a.policy})`),
    },
  });

  return {
    success: false,
    errorMessage: `All ${MAX_ATTEMPTS} attempts failed. See attemptLog for details.`,
    errorKind: "all_models_exhausted",
    attemptCount: MAX_ATTEMPTS,
    durationMs,
    attemptLog,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5 — WARNING FORMATTER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts the Vercel AI SDK SharedV3Warning union to plain strings.
 * Safe to call with undefined (returns []).
 */
export function mapWarnings(
  warnings: Array<{ type: string; feature?: string; message?: string }> | undefined
): string[] {
  if (!warnings?.length) return [];
  return warnings.map((w) =>
    w.type === "other" ? (w.message ?? "unknown warning") : `${w.type}: ${w.feature ?? ""}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6 — TOKEN-AWARE TRUNCATION
// ─────────────────────────────────────────────────────────────────────────────

/** Conservative character-to-token ratio (OpenAI BPE averages ~4 chars/token; we use 3.8). */
const CHARS_PER_TOKEN = 3.8;

/**
 * Estimate the number of tokens in a string using a character heuristic.
 * Accurate to within ±15% for English text.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Truncate text to a target token budget.
 * Truncates at sentence boundaries where possible to preserve coherence.
 *
 * @param text      Input text
 * @param maxTokens Maximum tokens allowed
 * @returns Truncated string (unchanged if already within budget)
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  if (maxTokens <= 0) {
    // Invalid budget — log in dev and return unchanged rather than silently
    // producing an empty string that would cause the AI call to fail.
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[truncateToTokens] maxTokens=${maxTokens} is invalid; returning text unchanged.`);
    }
    return text;
  }
  const maxChars = Math.floor(maxTokens * CHARS_PER_TOKEN);
  if (text.length <= maxChars) return text;

  // Try to truncate at the last sentence boundary within budget
  const candidate = text.slice(0, maxChars);
  const lastPeriod = Math.max(
    candidate.lastIndexOf(". "),
    candidate.lastIndexOf(".\n"),
    candidate.lastIndexOf("! "),
    candidate.lastIndexOf("? ")
  );

  if (lastPeriod > maxChars * 0.8) {
    return candidate.slice(0, lastPeriod + 1).trimEnd();
  }

  return candidate.trimEnd();
}

// ─────────────────────────────────────────────────────────────────────────────
// § 7 — UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

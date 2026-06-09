/**
 * Production-grade Model Router for the Career Readiness Platform.
 *
 * Responsibilities:
 *  • Centralized task → model configuration
 *  • Multi-tier failover chain (primary → secondaries → fallback)
 *  • Rate-limit detection and per-model backoff tracking
 *  • Circuit breaker per model (open on consecutive failures)
 *  • Provider abstraction (OpenRouter via Vercel AI SDK)
 *  • Structured observability (routing decisions, failure reasons)
 *
 * Server-only. Never import from client components.
 */

import { generateText, streamText, type ModelMessage } from "ai";
import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// § 1 — TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

/** All supported model IDs routed through OpenRouter. */
export const MODEL_IDS = [
  "qwen/qwen3-235b-a22b-2507",
  "qwen/qwen3-32b",
  "deepseek/deepseek-r1",
  "deepseek/deepseek-chat",
  "meta-llama/llama-4-maverick",
] as const;

export type ModelId = (typeof MODEL_IDS)[number];

/** Supported pipeline task names. */
export const TASK_NAMES = [
  "resumeParser",
  "skillExtraction",
  "atsAnalysis",
  "gapAnalysis",
  "roadmapGeneration",
  "careerCoach",
] as const;

export type TaskName = (typeof TASK_NAMES)[number];

/** Why the router fell over to the next model in the chain. */
export type FailoverReason =
  | "rate_limit"
  | "context_exceeded"
  | "model_unavailable"
  | "timeout"
  | "invalid_response"
  | "circuit_open"
  | "unknown";

/** Model capability flags. */
export type ModelCapability =
  | "reasoning"
  | "json_mode"
  | "vision"
  | "streaming"
  | "long_context";

/** Static metadata about a model. */
export interface ModelSpec {
  readonly id: ModelId;
  readonly label: string;
  readonly contextTokens: number;
  readonly capabilities: ReadonlySet<ModelCapability>;
  readonly requestsPerMinute: number;
  readonly requestsPerDay: number;
  /** Models with reasoning tokens require sanitization before JSON parse. */
  readonly emitsReasoningTokens: boolean;
}

/** Per-task routing configuration. */
export interface TaskRouteConfig {
  /** Ordered failover chain: index 0 = primary. */
  readonly chain: readonly [ModelId, ...ModelId[]];
  readonly temperature: number;
  readonly maxOutputTokens: number;
  /** Strip <think>…</think> blocks from output. */
  readonly stripReasoning: boolean;
}

/** The router's resolved decision for a single call. */
export interface RoutingDecision {
  readonly task: TaskName;
  readonly selectedModel: ModelId;
  readonly chainIndex: number;
  readonly failoverReasons: FailoverReason[];
  readonly attemptedModels: ModelId[];
}

/** Structured result from a routed completion. */
export interface RouterCompletionResult {
  readonly content: string;
  readonly decision: RoutingDecision;
  readonly usage: {
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly totalTokens: number;
  };
  readonly latencyMs: number;
  readonly finishReason: string | undefined;
}

/** Options for a single completion call. */
export interface RouterCallOptions {
  readonly task: TaskName;
  readonly messages: readonly RouterMessage[];
  readonly system?: string;
  /** Override model — bypasses routing entirely. */
  readonly modelOverride?: ModelId;
  /** Per-call temperature override. */
  readonly temperature?: number;
  /** Per-call max token override. */
  readonly maxOutputTokens?: number;
  /** Abort controller for streaming cancellation. */
  readonly signal?: AbortSignal;
}

export interface RouterMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

/** Circuit breaker state per model. */
interface CircuitState {
  isOpen: boolean;
  consecutiveFailures: number;
  openedAt: number | null;
  /** Total failures since process start. */
  totalFailures: number;
  totalSuccesses: number;
}

/** Rate limit tracking per model. */
interface RateLimitState {
  /** Timestamp when the rate limit was hit. */
  blockedUntil: number | null;
  requestsThisMinute: number;
  requestsThisDay: number;
  minuteWindowStart: number;
  dayWindowStart: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2 — MODEL SPECIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

const MODEL_SPECS: Readonly<Record<ModelId, ModelSpec>> = {
  "qwen/qwen3-235b-a22b-2507": {
    id: "qwen/qwen3-235b-a22b-2507",
    label: "Qwen3 235B A22B",
    contextTokens: 32768,
    capabilities: new Set(["json_mode", "vision", "streaming", "long_context"]),
    requestsPerMinute: 20,
    requestsPerDay: 1000,
    emitsReasoningTokens: false,
  },
  "qwen/qwen3-32b": {
    id: "qwen/qwen3-32b",
    label: "Qwen3 32B",
    contextTokens: 32768,
    capabilities: new Set(["json_mode", "streaming"]),
    requestsPerMinute: 30,
    requestsPerDay: 2000,
    emitsReasoningTokens: false,
  },
  "deepseek/deepseek-r1": {
    id: "deepseek/deepseek-r1",
    label: "DeepSeek R1",
    contextTokens: 65536,
    capabilities: new Set(["reasoning", "streaming", "long_context"]),
    requestsPerMinute: 15,
    requestsPerDay: 500,
    emitsReasoningTokens: true,
  },
  "deepseek/deepseek-chat": {
    id: "deepseek/deepseek-chat",
    label: "DeepSeek Chat V3",
    contextTokens: 65536,
    capabilities: new Set(["json_mode", "streaming", "long_context"]),
    requestsPerMinute: 30,
    requestsPerDay: 2000,
    emitsReasoningTokens: false,
  },
  "meta-llama/llama-4-maverick": {
    id: "meta-llama/llama-4-maverick",
    label: "Llama 4 Maverick",
    contextTokens: 131072,
    capabilities: new Set(["vision", "streaming", "long_context"]),
    requestsPerMinute: 20,
    requestsPerDay: 1000,
    emitsReasoningTokens: false,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// § 3 — TASK ROUTING TABLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authoritative task → model mapping per architecture spec.
 * Order of `chain` defines failover priority.
 */
const TASK_ROUTES: Readonly<Record<TaskName, TaskRouteConfig>> = {
  resumeParser: {
    chain: [
      "qwen/qwen3-235b-a22b-2507",
      "qwen/qwen3-32b",
      "meta-llama/llama-4-maverick",
    ],
    temperature: 0,
    maxOutputTokens: 4096,
    stripReasoning: false,
  },
  skillExtraction: {
    chain: [
      "qwen/qwen3-235b-a22b-2507",
      "qwen/qwen3-32b",
      "deepseek/deepseek-chat",
    ],
    temperature: 0,
    maxOutputTokens: 2048,
    stripReasoning: false,
  },
  atsAnalysis: {
    chain: [
      "deepseek/deepseek-r1",
      "deepseek/deepseek-chat",
      "qwen/qwen3-32b",
    ],
    temperature: 0.2,
    maxOutputTokens: 3000,
    stripReasoning: true,
  },
  gapAnalysis: {
    chain: [
      "deepseek/deepseek-r1",
      "deepseek/deepseek-chat",
      "qwen/qwen3-32b",
    ],
    temperature: 0.3,
    maxOutputTokens: 4096,
    stripReasoning: true,
  },
  roadmapGeneration: {
    chain: [
      "deepseek/deepseek-r1",
      "deepseek/deepseek-chat",
      "qwen/qwen3-32b",
    ],
    temperature: 0.4,
    maxOutputTokens: 6000,
    stripReasoning: true,
  },
  careerCoach: {
    chain: [
      "deepseek/deepseek-r1",
      "qwen/qwen3-32b",
      "meta-llama/llama-4-maverick",
    ],
    temperature: 0.7,
    maxOutputTokens: 2048,
    stripReasoning: true,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// § 4 — ENVIRONMENT OVERRIDES
// ─────────────────────────────────────────────────────────────────────────────

/** Env keys that override the primary model for each task. Evaluated at call time. */
const TASK_ENV_KEYS: Record<TaskName, string> = {
  resumeParser: "OPENROUTER_RESUME_INTELLIGENCE_MODEL",
  skillExtraction: "OPENROUTER_RESUME_INTELLIGENCE_MODEL",
  atsAnalysis: "OPENROUTER_ATS_MODEL",
  gapAnalysis: "OPENROUTER_GAP_ANALYSIS_MODEL",
  roadmapGeneration: "OPENROUTER_ROADMAP_MODEL",
  careerCoach: "OPENROUTER_CAREER_COPILOT_MODEL",
};

function readEnvPrimary(task: TaskName): ModelId | null {
  const value = process.env[TASK_ENV_KEYS[task]]?.trim();
  if (!value) return null;
  // Validate it is a known model; silently ignore unrecognized values.
  return (MODEL_IDS as ReadonlyArray<string>).includes(value)
    ? (value as ModelId)
    : null;
}

/** Build the effective chain for a task: env override replaces index 0 if valid. */
function buildEffectiveChain(
  task: TaskName,
  override?: ModelId
): ModelId[] {
  const route = TASK_ROUTES[task];
  const chain = [...route.chain] as ModelId[];

  const envPrimary = override ?? readEnvPrimary(task);
  if (envPrimary && envPrimary !== chain[0]) {
    // Splice env-specified primary to front, remove duplicate if present.
    const idx = chain.indexOf(envPrimary);
    if (idx > 0) chain.splice(idx, 1);
    chain.unshift(envPrimary);
  }

  // Always guarantee the global fallback is last.
  const globalFallback = readGlobalFallback();
  if (!chain.includes(globalFallback)) {
    chain.push(globalFallback);
  }

  return chain;
}

function readGlobalFallback(): ModelId {
  const value = process.env.OPENROUTER_FALLBACK_MODEL?.trim();
  if (value && (MODEL_IDS as ReadonlyArray<string>).includes(value)) {
    return value as ModelId;
  }
  return "meta-llama/llama-4-maverick";
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5 — CIRCUIT BREAKER
// ─────────────────────────────────────────────────────────────────────────────

const CIRCUIT_FAILURE_THRESHOLD = 5;
const CIRCUIT_RESET_AFTER_MS = 60_000; // 1 minute

class CircuitBreaker {
  private states = new Map<ModelId, CircuitState>();

  private getState(model: ModelId): CircuitState {
    if (!this.states.has(model)) {
      this.states.set(model, {
        isOpen: false,
        consecutiveFailures: 0,
        openedAt: null,
        totalFailures: 0,
        totalSuccesses: 0,
      });
    }
    return this.states.get(model)!;
  }

  isOpen(model: ModelId): boolean {
    const state = this.getState(model);
    if (!state.isOpen) return false;

    // Auto-reset after cooldown period.
    if (state.openedAt !== null && Date.now() - state.openedAt >= CIRCUIT_RESET_AFTER_MS) {
      state.isOpen = false;
      state.consecutiveFailures = 0;
      state.openedAt = null;
      return false;
    }

    return true;
  }

  recordSuccess(model: ModelId): void {
    const state = this.getState(model);
    state.consecutiveFailures = 0;
    state.totalSuccesses += 1;
    state.isOpen = false;
    state.openedAt = null;
  }

  recordFailure(model: ModelId): void {
    const state = this.getState(model);
    state.consecutiveFailures += 1;
    state.totalFailures += 1;

    if (state.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD && !state.isOpen) {
      state.isOpen = true;
      state.openedAt = Date.now();
      console.warn(
        `[ModelRouter] Circuit OPENED for "${model}" after ${state.consecutiveFailures} consecutive failures.`
      );
    }
  }

  getSnapshot(): Record<ModelId, CircuitState> {
    return Object.fromEntries(this.states.entries()) as Record<ModelId, CircuitState>;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6 — RATE LIMIT TRACKER
// ─────────────────────────────────────────────────────────────────────────────

const RATE_LIMIT_BACKOFF_MS = 62_000; // 62s — one full minute + buffer

class RateLimitTracker {
  private states = new Map<ModelId, RateLimitState>();

  private getState(model: ModelId): RateLimitState {
    if (!this.states.has(model)) {
      const now = Date.now();
      this.states.set(model, {
        blockedUntil: null,
        requestsThisMinute: 0,
        requestsThisDay: 0,
        minuteWindowStart: now,
        dayWindowStart: now,
      });
    }
    return this.states.get(model)!;
  }

  /** Returns true if the model is currently rate-limited. */
  isLimited(model: ModelId): boolean {
    const state = this.getState(model);
    if (state.blockedUntil !== null) {
      if (Date.now() < state.blockedUntil) return true;
      // Backoff period elapsed — clear block.
      state.blockedUntil = null;
    }

    // Slide windows.
    const now = Date.now();
    if (now - state.minuteWindowStart >= 60_000) {
      state.requestsThisMinute = 0;
      state.minuteWindowStart = now;
    }
    if (now - state.dayWindowStart >= 86_400_000) {
      state.requestsThisDay = 0;
      state.dayWindowStart = now;
    }

    const spec = MODEL_SPECS[model];
    if (state.requestsThisMinute >= spec.requestsPerMinute) return true;
    if (state.requestsThisDay >= spec.requestsPerDay) return true;

    return false;
  }

  /** Call before each request to increment counters. */
  recordRequest(model: ModelId): void {
    const state = this.getState(model);
    state.requestsThisMinute += 1;
    state.requestsThisDay += 1;
  }

  /** Call when the provider responds with a 429. */
  recordRateLimit(model: ModelId, retryAfterMs?: number): void {
    const state = this.getState(model);
    const backoff = retryAfterMs ?? RATE_LIMIT_BACKOFF_MS;
    state.blockedUntil = Date.now() + backoff;
    console.warn(
      `[ModelRouter] Rate limit hit for "${model}". Blocked for ${Math.round(backoff / 1000)}s.`
    );
  }

  /** Returns ms until model is available, or 0 if available now. */
  msUntilAvailable(model: ModelId): number {
    const state = this.getState(model);
    if (state.blockedUntil === null) return 0;
    return Math.max(0, state.blockedUntil - Date.now());
  }

  getSnapshot(): Record<ModelId, RateLimitState> {
    return Object.fromEntries(this.states.entries()) as Record<ModelId, RateLimitState>;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 7 — ERROR CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────

interface ClassifiedError {
  reason: FailoverReason;
  isRetryable: boolean;
  retryAfterMs?: number;
}

function classifyError(error: unknown): ClassifiedError {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  // Rate limiting
  if (
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("quota")
  ) {
    const retryAfter = extractRetryAfter(message);
    return { reason: "rate_limit", isRetryable: true, retryAfterMs: retryAfter };
  }

  // Context length
  if (
    lower.includes("context length") ||
    lower.includes("context_length_exceeded") ||
    lower.includes("maximum context") ||
    lower.includes("token limit")
  ) {
    return { reason: "context_exceeded", isRetryable: true };
  }

  // Model unavailable
  if (
    lower.includes("no endpoint") ||
    lower.includes("no provider") ||
    lower.includes("model not found") ||
    lower.includes("not available") ||
    lower.includes("unavailable") ||
    lower.includes("404") ||
    lower.includes("403")
  ) {
    return { reason: "model_unavailable", isRetryable: false };
  }

  // Timeout
  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("etimedout") ||
    lower.includes("aborted")
  ) {
    return { reason: "timeout", isRetryable: true };
  }

  return { reason: "unknown", isRetryable: true };
}

function extractRetryAfter(message: string): number | undefined {
  const match = message.match(/retry.{1,20}?(\d+)\s*s/i);
  if (match) return parseInt(match[1], 10) * 1000;
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 8 — OUTPUT SANITIZATION
// ─────────────────────────────────────────────────────────────────────────────

function sanitizeOutput(raw: string, stripReasoning: boolean): string {
  let text = raw;

  if (stripReasoning) {
    // Remove <think>…</think> blocks emitted by DeepSeek-R1 and Qwen3-Thinking.
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  }

  // Remove markdown code fences wrapping JSON.
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  return text;
}

function extractJsonBlock(text: string): string {
  const objMatch = text.match(/(\{[\s\S]*\})/);
  const arrMatch = text.match(/(\[[\s\S]*\])/);
  if (objMatch && arrMatch) {
    return objMatch.index! <= arrMatch.index! ? objMatch[1] : arrMatch[1];
  }
  return objMatch?.[1] ?? arrMatch?.[1] ?? text;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 9 — PROVIDER ABSTRACTION
// ─────────────────────────────────────────────────────────────────────────────

interface ProviderConfig {
  readonly name: "openrouter";
  readonly baseURL: string;
  readonly apiKeyEnvKey: string;
  readonly defaultHeaders: Record<string, string>;
}

const OPENROUTER_PROVIDER: ProviderConfig = {
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  apiKeyEnvKey: "OPENROUTER_API_KEY",
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    "X-Title": "Career Readiness Platform",
  },
};

function buildProvider(config: ProviderConfig): OpenAIProvider {
  const apiKey = process.env[config.apiKeyEnvKey]?.trim();
  if (!apiKey) {
    throw new Error(
      `[ModelRouter] Missing API key: environment variable "${config.apiKeyEnvKey}" is not set.`
    );
  }

  return createOpenAI({
    baseURL: config.baseURL,
    apiKey,
    headers: config.defaultHeaders,
  });
}

function toModelMessages(messages: readonly RouterMessage[]): ModelMessage[] {
  return messages.map((msg): ModelMessage => {
    if (msg.role === "assistant") {
      return {
        role: "assistant",
        content: [{ type: "text", text: msg.content }],
      };
    }
    return {
      role: "user",
      content: [{ type: "text", text: msg.content }],
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// § 10 — MODEL ROUTER (main class)
// ─────────────────────────────────────────────────────────────────────────────

export class ModelRouter {
  private readonly circuit = new CircuitBreaker();
  private readonly rateLimits = new RateLimitTracker();
  private readonly provider: ProviderConfig;

  constructor(provider: ProviderConfig = OPENROUTER_PROVIDER) {
    this.provider = provider;
  }

  // ── Public: complete ────────────────────────────────────────────────────────

  /**
   * Execute a non-streaming completion, walking the failover chain until
   * one model succeeds or all are exhausted.
   */
  async complete(options: RouterCallOptions): Promise<RouterCompletionResult> {
    const chain = options.modelOverride
      ? [options.modelOverride]
      : buildEffectiveChain(options.task, undefined);

    const route = TASK_ROUTES[options.task];
    const attemptedModels: ModelId[] = [];
    const failoverReasons: FailoverReason[] = [];

    for (let i = 0; i < chain.length; i++) {
      const modelId = chain[i];

      // Circuit breaker check.
      if (this.circuit.isOpen(modelId)) {
        failoverReasons.push("circuit_open");
        attemptedModels.push(modelId);
        continue;
      }

      // Rate limit check.
      if (this.rateLimits.isLimited(modelId)) {
        failoverReasons.push("rate_limit");
        attemptedModels.push(modelId);
        continue;
      }

      try {
        const result = await this.callModel(modelId, options, route);
        this.circuit.recordSuccess(modelId);
        return {
          ...result,
          decision: {
            task: options.task,
            selectedModel: modelId,
            chainIndex: i,
            failoverReasons,
            attemptedModels: [...attemptedModels, modelId],
          },
        };
      } catch (err) {
        const classified = classifyError(err);
        attemptedModels.push(modelId);
        failoverReasons.push(classified.reason);

        if (classified.reason === "rate_limit") {
          this.rateLimits.recordRateLimit(modelId, classified.retryAfterMs);
        } else {
          this.circuit.recordFailure(modelId);
        }

        const isLastModel = i === chain.length - 1;
        if (isLastModel) {
          throw new ModelRouterError(
            `All models in the failover chain for task "${options.task}" failed.`,
            options.task,
            attemptedModels,
            failoverReasons
          );
        }

        console.warn(
          `[ModelRouter] "${modelId}" failed (${classified.reason}). ` +
            `Trying next model in chain (${chain[i + 1]}).`
        );
      }
    }

    throw new ModelRouterError(
      `No available models for task "${options.task}". All are rate-limited or circuit-open.`,
      options.task,
      attemptedModels,
      failoverReasons
    );
  }

  // ── Public: completeJson ────────────────────────────────────────────────────

  /**
   * Complete and parse the response as JSON, validated by a Zod schema.
   * Raises ModelRouterError if all models fail.
   * Returns null if the output is valid JSON but fails schema validation.
   */
  async completeJson<T>(
    options: RouterCallOptions,
    schema: z.ZodSchema<T>
  ): Promise<{ data: T; decision: RoutingDecision } | null> {
    const result = await this.complete(options);
    const route = TASK_ROUTES[options.task];

    const sanitized = sanitizeOutput(result.content, route.stripReasoning);

    let parsed: unknown;
    try {
      parsed = JSON.parse(sanitized);
    } catch {
      try {
        parsed = JSON.parse(extractJsonBlock(sanitized));
      } catch {
        console.error(
          `[ModelRouter] JSON parse failure for task "${options.task}" ` +
            `(model: ${result.decision.selectedModel}). ` +
            `First 400 chars: ${result.content.slice(0, 400)}`
        );
        return null;
      }
    }

    const validation = schema.safeParse(parsed);
    if (!validation.success) {
      console.error(
        `[ModelRouter] Zod validation failure for task "${options.task}":`,
        validation.error.issues.slice(0, 5)
      );
      return null;
    }

    return { data: validation.data, decision: result.decision };
  }

  // ── Public: stream ──────────────────────────────────────────────────────────

  /**
   * Execute a streaming completion. Returns a Vercel AI SDK StreamTextResult.
   * Call `.toDataStreamResponse()` in a Next.js route handler.
   *
   * Note: Streaming always uses the first available (non-blocked) model.
   * Failover during mid-stream is not supported.
   */
  stream(options: RouterCallOptions) {
    const chain = options.modelOverride
      ? [options.modelOverride]
      : buildEffectiveChain(options.task, undefined);

    const route = TASK_ROUTES[options.task];

    // Resolve the first viable model.
    const modelId = this.resolveFirstAvailable(chain, options.task);
    const sdkProvider = buildProvider(this.provider);
    const messages = toModelMessages(options.messages);

    this.rateLimits.recordRequest(modelId);

    return streamText({
      model: sdkProvider(modelId),
      system: options.system,
      messages,
      temperature: options.temperature ?? route.temperature,
      maxOutputTokens: options.maxOutputTokens ?? route.maxOutputTokens,
    });
  }

  // ── Public: observability ───────────────────────────────────────────────────

  /** Returns current model IDs resolved for every task. */
  getRoutingTable(): Record<TaskName, ModelId[]> {
    return Object.fromEntries(
      TASK_NAMES.map((task) => [task, buildEffectiveChain(task)])
    ) as Record<TaskName, ModelId[]>;
  }

  /** Returns current circuit breaker and rate limit state. */
  getHealthSnapshot() {
    return {
      circuitBreakers: this.circuit.getSnapshot(),
      rateLimits: this.rateLimits.getSnapshot(),
    };
  }

  /** Returns metadata for a given model. */
  getModelSpec(modelId: ModelId): ModelSpec {
    return MODEL_SPECS[modelId];
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async callModel(
    modelId: ModelId,
    options: RouterCallOptions,
    route: TaskRouteConfig
  ): Promise<Omit<RouterCompletionResult, "decision">> {
    const sdkProvider = buildProvider(this.provider);
    const messages = toModelMessages(options.messages);

    this.rateLimits.recordRequest(modelId);
    const start = Date.now();

    const result = await generateText({
      model: sdkProvider(modelId),
      system: options.system,
      messages,
      temperature: options.temperature ?? route.temperature,
      maxOutputTokens: options.maxOutputTokens ?? route.maxOutputTokens,
      abortSignal: options.signal,
    });

    const inputTokens = result.usage?.inputTokens ?? 0;
    const outputTokens = result.usage?.outputTokens ?? 0;
    const rawContent = result.text;
    const content = sanitizeOutput(rawContent, route.stripReasoning);

    return {
      content,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
      latencyMs: Date.now() - start,
      finishReason: result.finishReason,
    };
  }

  private resolveFirstAvailable(chain: ModelId[], task: TaskName): ModelId {
    for (const modelId of chain) {
      if (this.circuit.isOpen(modelId)) continue;
      if (this.rateLimits.isLimited(modelId)) continue;
      return modelId;
    }

    // If all are blocked, return the last model as a last resort.
    console.warn(
      `[ModelRouter] All models for task "${task}" are blocked. Falling back to last in chain.`
    );
    return chain[chain.length - 1];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 11 — CUSTOM ERROR
// ─────────────────────────────────────────────────────────────────────────────

export class ModelRouterError extends Error {
  readonly task: TaskName;
  readonly attemptedModels: readonly ModelId[];
  readonly failoverReasons: readonly FailoverReason[];

  constructor(
    message: string,
    task: TaskName,
    attemptedModels: ModelId[],
    failoverReasons: FailoverReason[]
  ) {
    super(message);
    this.name = "ModelRouterError";
    this.task = task;
    this.attemptedModels = attemptedModels;
    this.failoverReasons = failoverReasons;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 12 — SINGLETON + CONVENIENCE API
// ─────────────────────────────────────────────────────────────────────────────

export const modelRouter = new ModelRouter();

/**
 * Route a task completion call through the production model router.
 *
 * @example
 * ```ts
 * const result = await routeCompletion({
 *   task: "gapAnalysis",
 *   system: GAP_ANALYZER_SYSTEM_PROMPT,
 *   messages: [{ role: "user", content: prompt }],
 * });
 * console.log(result.content, result.decision.selectedModel);
 * ```
 */
export function routeCompletion(
  options: RouterCallOptions
): Promise<RouterCompletionResult> {
  return modelRouter.complete(options);
}

/**
 * Route a task completion and parse the result against a Zod schema.
 *
 * @example
 * ```ts
 * const parsed = await routeJson({
 *   task: "gapAnalysis",
 *   messages: [...],
 * }, GapAnalysisOutputSchema);
 * if (parsed) console.log(parsed.data.overallMatchScore);
 * ```
 */
export function routeJson<T>(
  options: RouterCallOptions,
  schema: z.ZodSchema<T>
): Promise<{ data: T; decision: RoutingDecision } | null> {
  return modelRouter.completeJson(options, schema);
}

/**
 * Route a streaming completion.
 * Returns a Vercel AI SDK StreamTextResult for use with `.toDataStreamResponse()`.
 *
 * @example
 * ```ts
 * // app/api/coach/route.ts
 * export async function POST(req: Request) {
 *   const body = await req.json();
 *   const stream = routeStream({ task: "careerCoach", messages: body.messages });
 *   return stream.toDataStreamResponse();
 * }
 * ```
 */
export function routeStream(options: RouterCallOptions) {
  return modelRouter.stream(options);
}

// ─────────────────────────────────────────────────────────────────────────────
// § 13 — RE-EXPORTS FOR CONSUMERS
// ─────────────────────────────────────────────────────────────────────────────

export { MODEL_SPECS, TASK_ROUTES, OPENROUTER_PROVIDER };
export type { ProviderConfig };

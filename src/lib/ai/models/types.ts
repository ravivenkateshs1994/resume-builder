// ── Model ID Catalogue ────────────────────────────────────────────────────────

export const MODEL_IDS = [
  "qwen/qwen3-235b-a22b-2507",
  "qwen/qwen3-32b",
  "deepseek/deepseek-chat",
  "deepseek/deepseek-r1",
  "meta-llama/llama-4-maverick",
] as const;

export type ModelId = (typeof MODEL_IDS)[number];

// ── Task Names ────────────────────────────────────────────────────────────────

export const TASK_NAMES = [
  "resumeParse",
  "skillExtraction",
  "atsAnalysis",
  "gapAnalysis",
  "roadmapGeneration",
  "careerCoach",
  "interviewPrep",
  "fallback",
] as const;

export type TaskName = (typeof TASK_NAMES)[number];

// ── Model Capability Flags ────────────────────────────────────────────────────

export type ModelCapability =
  | "text"
  | "json"
  | "vision"
  | "reasoning"
  | "streaming";

export interface ModelMetadata {
  readonly id: ModelId;
  readonly label: string;
  readonly capabilities: readonly ModelCapability[];
  readonly contextWindow: number;
  readonly supportsStreaming: boolean;
  readonly supportsJsonMode: boolean;
}

// ── Chat Message Types ────────────────────────────────────────────────────────

export type MessageRole = "system" | "user" | "assistant";

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface ChatMessage {
  role: MessageRole;
  content: string | ContentPart[];
}

// ── Completion Request / Response ─────────────────────────────────────────────

export interface CompletionRequest {
  task: TaskName;
  messages: ChatMessage[];
  /** Override the model resolved from task routing. */
  modelOverride?: string;
  /** System prompt injected before the message history. */
  system?: string;
  temperature?: number;
  maxTokens?: number;
  /** Suppress chain-of-thought tokens on reasoning models. */
  disableReasoning?: boolean;
}

export interface CompletionResponse {
  content: string;
  modelUsed: ModelId;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

// ── Stream Request ────────────────────────────────────────────────────────────

export interface StreamRequest extends CompletionRequest {
  /** Optional system prompt injected before message history. */
  system?: string;
}

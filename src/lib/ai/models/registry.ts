import type { ModelId, ModelMetadata } from "./types";

export const MODEL_REGISTRY: Readonly<Record<ModelId, ModelMetadata>> = {
  "qwen/qwen3-235b-a22b-2507": {
    id: "qwen/qwen3-235b-a22b-2507",
    label: "Qwen3 235B A22B",
    capabilities: ["text", "json", "vision", "streaming"],
    contextWindow: 32768,
    supportsStreaming: true,
    supportsJsonMode: true,
  },
  "qwen/qwen3-32b": {
    id: "qwen/qwen3-32b",
    label: "Qwen3 32B",
    capabilities: ["text", "json", "streaming"],
    contextWindow: 32768,
    supportsStreaming: true,
    supportsJsonMode: true,
  },
  "deepseek/deepseek-chat": {
    id: "deepseek/deepseek-chat",
    label: "DeepSeek Chat V3",
    capabilities: ["text", "json", "streaming"],
    contextWindow: 65536,
    supportsStreaming: true,
    supportsJsonMode: true,
  },
  "deepseek/deepseek-r1": {
    id: "deepseek/deepseek-r1",
    label: "DeepSeek R1",
    capabilities: ["text", "json", "reasoning", "streaming"],
    contextWindow: 65536,
    supportsStreaming: true,
    supportsJsonMode: false,
  },
  "meta-llama/llama-4-maverick": {
    id: "meta-llama/llama-4-maverick",
    label: "Llama 4 Maverick",
    capabilities: ["text", "vision", "streaming"],
    contextWindow: 131072,
    supportsStreaming: true,
    supportsJsonMode: false,
  },
} as const;

export function getModelMetadata(id: ModelId): ModelMetadata {
  const meta = MODEL_REGISTRY[id];
  if (!meta) throw new Error(`Model not found in registry: "${id}"`);
  return meta;
}

export function modelHasCapability(
  id: ModelId,
  capability: ModelCapability
): boolean {
  return MODEL_REGISTRY[id]?.capabilities.includes(capability) ?? false;
}

// Re-exported for convenience
import type { ModelCapability } from "./types";

import { generateText, streamText, type ModelMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { ZodSchema } from "zod";
import {
  resolveModel,
  resolveModelWithFallback,
} from "../models/router";
import type {
  ModelId,
  CompletionRequest,
  CompletionResponse,
  StreamRequest,
  ChatMessage,
} from "../models/types";

// ── Provider Factory ──────────────────────────────────────────────────────────

function createProvider() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured. Set it in .env.local."
    );
  }

  return createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
    headers: {
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000",
      "X-Title": "Career Readiness Platform",
    },
  });
}

// ── Message Conversion ────────────────────────────────────────────────────────

function toCoreMessages(messages: ChatMessage[]): ModelMessage[] {
  return messages
    .filter((m) => m.role !== "system")
    .map((msg): ModelMessage => {
      if (typeof msg.content === "string") {
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
      }

      // Multi-part content (vision)
      if (msg.role === "user") {
        return {
          role: "user",
          content: msg.content.map((part) => {
            if (part.type === "text") {
              return { type: "text" as const, text: part.text };
            }
            return { type: "image" as const, image: part.image_url.url };
          }),
        };
      }

      // Assistant with parts
      return {
        role: "assistant",
        content: (msg.content as Array<{ type: string; text?: string }>)
          .filter((p) => p.type === "text")
          .map((p) => ({ type: "text" as const, text: p.text ?? "" })),
      };
    });
}

// ── JSON Sanitization ─────────────────────────────────────────────────────────

function sanitizeJsonOutput(raw: string): string {
  // Strip reasoning-model think blocks (DeepSeek-R1, Qwen3 with thinking)
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  // Strip markdown code fences
  cleaned = cleaned
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return cleaned;
}

function extractFirstJsonBlock(text: string): string {
  const objMatch = text.match(/(\{[\s\S]*\})/);
  const arrMatch = text.match(/(\[[\s\S]*\])/);
  if (objMatch && arrMatch) {
    return objMatch.index! <= arrMatch.index! ? objMatch[1] : arrMatch[1];
  }
  return objMatch?.[1] ?? arrMatch?.[1] ?? text;
}

// ── Core Client Class ─────────────────────────────────────────────────────────

class OpenRouterClient {
  /**
   * Execute a non-streaming completion with automatic fallback.
   */
  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const [primary, fallback] = resolveModelWithFallback(
      request.task,
      request.modelOverride
    );

    const provider = createProvider();
    const messages = toCoreMessages(request.messages);

    async function attempt(modelId: ModelId): Promise<CompletionResponse> {
      const result = await generateText({
        model: provider(modelId),
        system: request.system,
        messages,
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens,
        ...(request.disableReasoning
          ? { providerOptions: { openai: { reasoning_effort: "none" } } }
          : {}),
      });

      return {
        content: result.text,
        modelUsed: modelId,
        usage: result.usage
          ? {
              promptTokens: result.usage.inputTokens ?? 0,
              completionTokens: result.usage.outputTokens ?? 0,
              totalTokens:
                (result.usage.inputTokens ?? 0) +
                (result.usage.outputTokens ?? 0),
            }
          : undefined,
        finishReason: result.finishReason,
      };
    }

    try {
      return await attempt(primary);
    } catch (primaryError) {
      if (fallback === primary) throw primaryError;
      try {
        return await attempt(fallback);
      } catch (fallbackError) {
        throw new Error(
          `Primary model "${primary}" failed: ${String(primaryError)}. ` +
            `Fallback model "${fallback}" also failed: ${String(fallbackError)}.`
        );
      }
    }
  }

  /**
   * Execute a streaming completion. Returns a Vercel AI SDK StreamTextResult
   * so callers can use .toDataStreamResponse() in Next.js route handlers.
   */
  stream(request: StreamRequest) {
    const provider = createProvider();
    const modelId = resolveModel(request.task, request.modelOverride);
    const messages = toCoreMessages(request.messages);

    return streamText({
      model: provider(modelId),
      system: request.system,
      messages,
      temperature: request.temperature ?? 0.7,
      maxOutputTokens: request.maxTokens,
    });
  }

  /**
   * Complete and parse the response as JSON, validated by a Zod schema.
   * Returns null on parse/validation failure rather than throwing.
   */
  async completeJson<T>(
    request: CompletionRequest,
    schema: ZodSchema<T>,
    system?: string
  ): Promise<T | null> {
    if (system && !request.system) {
      request = { ...request, system };
    }
    const response = await this.complete(request);
    const cleaned = sanitizeJsonOutput(response.content);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      try {
        parsed = JSON.parse(extractFirstJsonBlock(cleaned));
      } catch {
        console.error(
          "[OpenRouterClient] JSON parse failed. Raw output:\n",
          response.content.slice(0, 500)
        );
        return null;
      }
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      console.error(
        "[OpenRouterClient] Zod validation failed:",
        result.error.issues
      );
      return null;
    }

    return result.data;
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

export const openRouterClient = new OpenRouterClient();

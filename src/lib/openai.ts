type OpenRouterMessagePart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string | OpenRouterMessagePart[];
};

type JsonSchema = {
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
};

export type OpenRouterTask =
  | "atsAnalysis"
  | "gapAnalysis"
  | "resumeIntelligence"
  | "careerCopilot"
  | "roadmapGeneration"
  | "interviewQuestions"
  | "fallback";

type CallOptions = {
  task?: OpenRouterTask;
  fallbackTask?: OpenRouterTask;
  model?: string;
  disableReasoning?: boolean;
  system?: string;
};

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_ATS_MODEL = process.env.OPENROUTER_ATS_MODEL?.trim() || "openai/gpt-oss-120b:free";
const DEFAULT_GAP_MODEL = process.env.OPENROUTER_GAP_ANALYSIS_MODEL?.trim() || DEFAULT_ATS_MODEL;
const DEFAULT_RESUME_INTELLIGENCE_MODEL = process.env.OPENROUTER_RESUME_INTELLIGENCE_MODEL?.trim() || DEFAULT_ATS_MODEL;
const DEFAULT_CAREER_COPILOT_MODEL = process.env.OPENROUTER_CAREER_COPILOT_MODEL?.trim() || "google/gemma-4-31b-it:free";
const DEFAULT_ROADMAP_MODEL = process.env.OPENROUTER_ROADMAP_MODEL?.trim() || DEFAULT_CAREER_COPILOT_MODEL;
const DEFAULT_INTERVIEW_MODEL = process.env.OPENROUTER_INTERVIEW_MODEL?.trim() || DEFAULT_CAREER_COPILOT_MODEL;
const DEFAULT_FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL?.trim() || "openai/gpt-oss-20b:free";
const DEFAULT_TEXT_MODEL = process.env.OPENROUTER_TEXT_MODEL?.trim() || DEFAULT_CAREER_COPILOT_MODEL;
const DEFAULT_IMAGE_MODEL = process.env.OPENROUTER_IMAGE_MODEL?.trim() || DEFAULT_FALLBACK_MODEL;
const DEFAULT_JSON_MODEL = process.env.OPENROUTER_JSON_MODEL?.trim() || DEFAULT_ATS_MODEL;

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not set in .env.local");
  }
  return key;
}

function resolveTaskModel(task?: OpenRouterTask, kind: "text" | "image" | "json" = "text"): string {
  if (task === "atsAnalysis") return DEFAULT_ATS_MODEL;
  if (task === "gapAnalysis") return DEFAULT_GAP_MODEL;
  if (task === "resumeIntelligence") return DEFAULT_RESUME_INTELLIGENCE_MODEL;
  if (task === "careerCopilot") return DEFAULT_CAREER_COPILOT_MODEL;
  if (task === "roadmapGeneration") return DEFAULT_ROADMAP_MODEL;
  if (task === "interviewQuestions") return DEFAULT_INTERVIEW_MODEL;
  if (task === "fallback") return DEFAULT_FALLBACK_MODEL;

  if (kind === "image") return DEFAULT_IMAGE_MODEL;
  if (kind === "json") return DEFAULT_JSON_MODEL;
  return DEFAULT_TEXT_MODEL;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    return (
      payload?.error?.message ||
      payload?.error?.details ||
      payload?.message ||
      (typeof payload?.error === "string" ? payload.error : "") ||
      JSON.stringify(payload)
    );
  } catch {
    return await response.text();
  }
}

async function decodeOpenRouterContent(response: Response): Promise<string> {
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "object" && part !== null && "text" in part ? String((part as { text?: string }).text ?? "") : ""))
      .join("")
      .trim();
  }

  return "";
}

async function callOpenRouter(input: {
  model?: string;
  task?: OpenRouterTask;
  fallbackTask?: OpenRouterTask;
  messages: OpenRouterMessage[];
  temperature?: number;
  disableReasoning?: boolean;
  responseFormat?: { type: "json_schema"; json_schema: JsonSchema };
}): Promise<string> {
  const model = input.model?.trim() || resolveTaskModel(input.task);
  const fallbackModel = resolveTaskModel(input.fallbackTask ?? "fallback");

  async function request(activeModel: string): Promise<Response> {
    return fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getApiKey()}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000",
        "X-Title": "Career Readiness",
      },
      body: JSON.stringify({
        model: activeModel,
        messages: input.messages,
        temperature: input.temperature ?? 0.7,
        stream: false,
        ...(input.disableReasoning ? { reasoning: { enabled: false } } : {}),
        ...(input.responseFormat ? { response_format: input.responseFormat } : {}),
      }),
    });
  }

  const response = await request(model);

  if (!response.ok) {
    const message = await readErrorMessage(response);
    const isEndpointUnavailable =
      (response.status === 400 || response.status === 404) &&
      /no endpoint|no provider|model not found|not available|unavailable/i.test(message);
    const shouldRetry =
      fallbackModel &&
      fallbackModel !== model &&
      (response.status === 429 || response.status >= 500 || isEndpointUnavailable);
    if (shouldRetry) {
      const fallbackResponse = await request(fallbackModel);
      if (!fallbackResponse.ok) {
        const fallbackMessage = await readErrorMessage(fallbackResponse);
        throw new Error(
          `[primary: ${model}] ${message} | [fallback: ${fallbackModel}] ${fallbackMessage || `status ${fallbackResponse.status}`}`
        );
      }
      return decodeOpenRouterContent(fallbackResponse);
    }

    throw new Error(message || `OpenRouter request failed with status ${response.status}.`);
  }

  return decodeOpenRouterContent(response);
}

/**
 * Simple helper that sends a text prompt and returns the response text.
 */
export async function generate(prompt: string, temperature = 0.7, options?: CallOptions): Promise<string> {
  const messages: OpenRouterMessage[] = [];
  if (options?.system) {
    messages.push({ role: "system", content: options.system });
  }
  messages.push({ role: "user", content: prompt });
  return callOpenRouter({
    model: options?.model,
    task: options?.task ?? "careerCopilot",
    fallbackTask: options?.fallbackTask ?? "fallback",
    messages,
    temperature,
    disableReasoning: options?.disableReasoning,
  });
}

/**
 * Multimodal helper that accepts text plus base64 image data URLs.
 */
export async function generateWithImages(
  textPrompt: string,
  imageDataUrls: string[],
  temperature = 0,
  options?: CallOptions
): Promise<string> {
  const parts: OpenRouterMessagePart[] = [
    { type: "text", text: textPrompt },
    ...imageDataUrls
      .filter((url) => typeof url === "string" && url.startsWith("data:image/"))
      .map((url): OpenRouterMessagePart => ({ type: "image_url", image_url: { url } })),
  ];

  const messages: OpenRouterMessage[] = [];
  if (options?.system) {
    messages.push({ role: "system", content: options.system });
  }
  messages.push({ role: "user", content: parts });

  return callOpenRouter({
    model: options?.model,
    task: options?.task ?? "fallback",
    fallbackTask: options?.fallbackTask ?? "fallback",
    messages,
    temperature,
    disableReasoning: options?.disableReasoning,
  });
}

/**
 * Structured JSON helper for schema-guided outputs.
 */
export async function generateJson(
  prompt: string,
  schema: JsonSchema,
  temperature = 0,
  options?: CallOptions
): Promise<string> {
  return callOpenRouter({
    model: options?.model,
    task: options?.task ?? "resumeIntelligence",
    fallbackTask: options?.fallbackTask ?? "fallback",
    messages: [{ role: "user", content: prompt }],
    temperature,
    disableReasoning: options?.disableReasoning,
    responseFormat: { type: "json_schema", json_schema: schema },
  });
}

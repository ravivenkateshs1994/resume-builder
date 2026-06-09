import { openRouterClient } from "./openrouter";
import {
  buildCareerCoachSystemPrompt,
  buildCoachContextBlock,
  INTERVIEW_PREP_SYSTEM_PROMPT,
  buildInterviewPrepPrompt,
} from "../prompts/career-coach";
import {
  CoachRequestSchema,
  InterviewPrepOutputSchema,
  type CoachRequest,
  type CoachMessage,
  type InterviewPrepOutput,
} from "../schemas/coach";
import type { ChatMessage } from "../models/types";

// ── Message History Converter ─────────────────────────────────────────────────

function coachMessagesToChatMessages(
  history: CoachMessage[],
  contextBlock: string,
  newUserMessage: string
): ChatMessage[] {
  const messages: ChatMessage[] = [];

  // Inject grounding context as the first user turn if present
  if (contextBlock) {
    messages.push({
      role: "user",
      content: `Here is my background information:\n\n${contextBlock}`,
    });
    messages.push({
      role: "assistant",
      content:
        "Thank you for sharing your background. I've reviewed your resume, job description, and gap analysis. How can I help you today?",
    });
  }

  // Inject previous conversation turns
  for (const msg of history) {
    if (msg.role === "system") continue; // system handled separately
    messages.push({ role: msg.role, content: msg.content });
  }

  // New user message
  messages.push({ role: "user", content: newUserMessage });

  return messages;
}

// ── Non-streaming Response ────────────────────────────────────────────────────

/**
 * Returns a single career coach response (non-streaming).
 */
export async function getCoachResponse(
  request: CoachRequest
): Promise<string | null> {
  const validated = CoachRequestSchema.safeParse(request);
  if (!validated.success) {
    throw new Error(
      `Invalid coach request: ${JSON.stringify(validated.error.issues)}`
    );
  }

  const { message, context } = validated.data;

  const system = buildCareerCoachSystemPrompt({
    targetRole: context.targetRole,
    careerStage: context.careerStage,
    hasResume: Boolean(context.resumeText?.trim()),
    hasJobDescription: Boolean(context.jobDescription?.trim()),
  });

  const contextBlock = buildCoachContextBlock({
    resumeText: context.resumeText,
    jobDescription: context.jobDescription,
    gapSummary: context.gapSummary,
  });

  const messages = coachMessagesToChatMessages(
    context.previousMessages,
    contextBlock,
    message
  );

  const response = await openRouterClient.complete({
    task: "careerCoach",
    system,
    messages,
    temperature: 0.7,
  });

  return response.content;
}

// ── Streaming Response ────────────────────────────────────────────────────────

/**
 * Returns a Vercel AI SDK StreamTextResult for use in Next.js route handlers.
 * Usage: `return coachStream.toDataStreamResponse();`
 */
export function streamCoachResponse(request: CoachRequest) {
  const validated = CoachRequestSchema.safeParse(request);
  if (!validated.success) {
    throw new Error(
      `Invalid coach request: ${JSON.stringify(validated.error.issues)}`
    );
  }

  const { message, context } = validated.data;

  const system = buildCareerCoachSystemPrompt({
    targetRole: context.targetRole,
    careerStage: context.careerStage,
    hasResume: Boolean(context.resumeText?.trim()),
    hasJobDescription: Boolean(context.jobDescription?.trim()),
  });

  const contextBlock = buildCoachContextBlock({
    resumeText: context.resumeText,
    jobDescription: context.jobDescription,
    gapSummary: context.gapSummary,
  });

  const messages = coachMessagesToChatMessages(
    context.previousMessages,
    contextBlock,
    message
  );

  return openRouterClient.stream({
    task: "careerCoach",
    system,
    messages,
    temperature: 0.7,
  });
}

// ── Interview Prep ────────────────────────────────────────────────────────────

export async function generateInterviewQuestions(params: {
  targetRole: string;
  category: "behavioral" | "technical" | "system-design";
  focusSkills?: string[];
  count?: number;
}): Promise<InterviewPrepOutput | null> {
  return openRouterClient.completeJson(
    {
      task: "interviewPrep",
      system: INTERVIEW_PREP_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildInterviewPrepPrompt(params),
        },
      ],
      temperature: 0.5,
    },
    InterviewPrepOutputSchema
  );
}

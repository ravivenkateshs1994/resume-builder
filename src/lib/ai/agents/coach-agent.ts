import {
  getCoachResponse,
  streamCoachResponse,
  generateInterviewQuestions,
} from "../services/career-coach";
import { resolveModel } from "../models/router";
import { runAgent, type Agent, type AgentResult } from "./types";
import type {
  CoachRequest,
  CoachMessage,
  InterviewPrepOutput,
} from "../schemas/coach";

// ── Coach Response Agent ──────────────────────────────────────────────────────

export const coachAgent: Agent<CoachRequest, string> = {
  name: "CoachAgent",
  task: "careerCoach",
  description:
    "Provides personalized career coaching responses grounded in the candidate's resume and gap analysis using DeepSeek-R1.",

  async run(input: CoachRequest): Promise<AgentResult<string>> {
    return runAgent(() => getCoachResponse(input), resolveModel("careerCoach"));
  },
};

// ── Streaming Coach (Not wrapped in AgentResult — returns stream directly) ────

/**
 * Returns a Vercel AI SDK StreamTextResult for use in Next.js streaming routes.
 *
 * @example
 * ```ts
 * // app/api/coach/route.ts
 * export async function POST(req: Request) {
 *   const body = await req.json();
 *   const stream = streamingCoachAgent(body);
 *   return stream.toDataStreamResponse();
 * }
 * ```
 */
export function streamingCoachAgent(request: CoachRequest) {
  return streamCoachResponse(request);
}

// ── Interview Prep Agent ──────────────────────────────────────────────────────

export interface InterviewPrepInput {
  targetRole: string;
  category: "behavioral" | "technical" | "system-design";
  focusSkills?: string[];
  count?: number;
}

export const interviewPrepAgent: Agent<
  InterviewPrepInput,
  InterviewPrepOutput
> = {
  name: "InterviewPrepAgent",
  task: "interviewPrep",
  description:
    "Generates targeted interview questions with answer frameworks for technical and behavioral preparation.",

  async run(
    input: InterviewPrepInput
  ): Promise<AgentResult<InterviewPrepOutput>> {
    return runAgent(
      () => generateInterviewQuestions(input),
      resolveModel("interviewPrep")
    );
  },
};

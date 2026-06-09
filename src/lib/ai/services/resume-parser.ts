import { openRouterClient } from "./openrouter";
import {
  RESUME_PARSER_SYSTEM_PROMPT,
  buildResumeParserPrompt,
} from "../prompts/resume-parser";
import {
  ParsedResumeSchema,
  type ParsedResumeOutput,
} from "../schemas/resume";

// ── Input ─────────────────────────────────────────────────────────────────────

export interface ResumeParserInput {
  /** Raw text extracted from PDF or DOCX. */
  resumeText: string;
  /** Optional base64 data URL of the first page image for vision-augmented parsing. */
  imageDataUrl?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * AI-powered resume parser using Qwen3-235B.
 * Extracts structured data from raw resume text.
 * Returns null if parsing fails — caller should fall back to heuristic parser.
 */
export async function parseResumeWithAI(
  input: ResumeParserInput
): Promise<ParsedResumeOutput | null> {
  if (!input.resumeText?.trim()) return null;

  const userContent = buildResumeParserPrompt(
    // Cap at 8000 chars to stay within context budget
    input.resumeText.slice(0, 8000)
  );

  return openRouterClient.completeJson(
    {
      task: "resumeParse",
      system: RESUME_PARSER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
      temperature: 0,
      disableReasoning: true,
    },
    ParsedResumeSchema
  );
}

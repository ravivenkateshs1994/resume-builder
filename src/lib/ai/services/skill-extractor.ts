import { openRouterClient } from "./openrouter";
import {
  SKILL_EXTRACTOR_SYSTEM_PROMPT,
  JOB_REQUIREMENTS_SYSTEM_PROMPT,
  buildSkillExtractionPrompt,
  buildJobRequirementsPrompt,
} from "../prompts/skill-extractor";
import {
  SkillExtractionOutputSchema,
  JobRequirementsSchema,
  type SkillExtractionOutput,
  type JobRequirementsOutput,
} from "../schemas/skills";

// ── Resume Skills ─────────────────────────────────────────────────────────────

/**
 * Extracts categorized skills from resume text using Qwen3-235B.
 */
export async function extractResumeSkills(
  resumeText: string
): Promise<SkillExtractionOutput | null> {
  if (!resumeText.trim()) return null;

  return openRouterClient.completeJson(
    {
      task: "skillExtraction",
      system: SKILL_EXTRACTOR_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildSkillExtractionPrompt(
            resumeText.slice(0, 6000),
            "resume"
          ),
        },
      ],
      temperature: 0,
      disableReasoning: true,
    },
    SkillExtractionOutputSchema
  );
}

// ── Job Requirements ──────────────────────────────────────────────────────────

/**
 * Extracts structured hiring requirements from a job description.
 */
export async function extractJobRequirements(
  jobDescription: string
): Promise<JobRequirementsOutput | null> {
  if (!jobDescription.trim()) return null;

  return openRouterClient.completeJson(
    {
      task: "skillExtraction",
      system: JOB_REQUIREMENTS_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildJobRequirementsPrompt(jobDescription.slice(0, 4000)),
        },
      ],
      temperature: 0,
      disableReasoning: true,
    },
    JobRequirementsSchema
  );
}

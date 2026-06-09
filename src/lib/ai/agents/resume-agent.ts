import { parseResumeWithAI, type ResumeParserInput } from "../services/resume-parser";
import { extractResumeSkills } from "../services/skill-extractor";
import { resolveModel } from "../models/router";
import { runAgent, type Agent, type AgentResult } from "./types";
import type { ParsedResumeOutput } from "../schemas/resume";
import type { SkillExtractionOutput } from "../schemas/skills";

// ── Outputs ───────────────────────────────────────────────────────────────────

export interface ResumeAgentOutput {
  parsed: ParsedResumeOutput;
  skills: SkillExtractionOutput;
}

// ── Agent ─────────────────────────────────────────────────────────────────────

export const resumeAgent: Agent<ResumeParserInput, ResumeAgentOutput> = {
  name: "ResumeAgent",
  task: "resumeParse",
  description:
    "Parses raw resume text into structured data and extracts categorized skill signals using Qwen3-235B.",

  async run(
    input: ResumeParserInput
  ): Promise<AgentResult<ResumeAgentOutput>> {
    const modelUsed = resolveModel("resumeParse");
    const start = Date.now();

    try {
      // Run both operations concurrently — they use the same input text
      const [parsedResult, skillsResult] = await Promise.all([
        parseResumeWithAI(input),
        extractResumeSkills(input.resumeText),
      ]);

      const durationMs = Date.now() - start;

      if (!parsedResult) {
        return {
          success: false,
          error: "Resume parsing returned null — model output could not be validated.",
          durationMs,
          modelUsed,
        };
      }

      // Skill extraction is best-effort; fall back to skills from parsed resume
      const skills: SkillExtractionOutput = skillsResult ?? {
        skills: parsedResult.skills,
        technologies: [],
        tools: [],
        frameworks: [],
        certifications: parsedResult.certifications.map((c) => c.name),
        methodologies: [],
        softSkills: [],
      };

      return {
        success: true,
        data: { parsed: parsedResult, skills },
        durationMs,
        modelUsed,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
        modelUsed,
      };
    }
  },
};

import { analyzeGap, type GapAnalyzerInput } from "../services/gap-analyzer";
import { extractJobRequirements } from "../services/skill-extractor";
import { resolveModel } from "../models/router";
import { runAgent, type Agent, type AgentResult } from "./types";
import type { GapAnalysisOutput } from "../schemas/gap";
import type { JobRequirementsOutput } from "../schemas/skills";

// ── Input ─────────────────────────────────────────────────────────────────────

export interface GapAgentInput {
  /** Raw job description text — agent will extract requirements internally. */
  jobDescription: string;
  /** Pre-extracted resume skill signals from ResumeAgent. */
  resumeSkills: GapAnalyzerInput["resumeSkills"];
  /** Optional pre-parsed job requirements. If absent, agent extracts them. */
  jobRequirements?: JobRequirementsOutput;
  careerStage?: string;
}

// ── Output ────────────────────────────────────────────────────────────────────

export interface GapAgentOutput {
  jobRequirements: JobRequirementsOutput;
  gapAnalysis: GapAnalysisOutput;
}

// ── Fallback requirements when extraction fails ───────────────────────────────

function buildFallbackRequirements(
  jobDescription: string
): JobRequirementsOutput {
  // Simple keyword extraction as a last resort
  const words = jobDescription
    .split(/\W+/)
    .filter((w) => w.length > 3)
    .map((w) => w.toLowerCase());

  return {
    requiredSkills: [...new Set(words)].slice(0, 20),
    preferredSkills: [],
    tools: [],
    frameworks: [],
    certifications: [],
    yearsExperience: null,
    seniority: "unknown",
    responsibilities: [],
  };
}

// ── Agent ─────────────────────────────────────────────────────────────────────

export const gapAgent: Agent<GapAgentInput, GapAgentOutput> = {
  name: "GapAgent",
  task: "gapAnalysis",
  description:
    "Extracts job requirements from a job description then performs deep gap analysis against the candidate's skill profile using DeepSeek-R1.",

  async run(input: GapAgentInput): Promise<AgentResult<GapAgentOutput>> {
    const modelUsed = resolveModel("gapAnalysis");
    const start = Date.now();

    try {
      // Extract job requirements if not pre-supplied
      const jobRequirements =
        input.jobRequirements ??
        (await extractJobRequirements(input.jobDescription)) ??
        buildFallbackRequirements(input.jobDescription);

      // Run gap analysis
      const gapAnalysis = await analyzeGap({
        resumeSkills: input.resumeSkills,
        jobRequirements,
        careerStage: input.careerStage,
      });

      const durationMs = Date.now() - start;

      if (!gapAnalysis) {
        return {
          success: false,
          error: "Gap analysis returned null — model output could not be validated.",
          durationMs,
          modelUsed,
        };
      }

      return {
        success: true,
        data: { jobRequirements, gapAnalysis },
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

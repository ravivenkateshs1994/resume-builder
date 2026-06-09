import { openRouterClient } from "./openrouter";
import {
  GAP_ANALYZER_SYSTEM_PROMPT,
  buildGapAnalysisPrompt,
} from "../prompts/gap-analyzer";
import { GapAnalysisOutputSchema, type GapAnalysisOutput } from "../schemas/gap";
import type { SkillExtractionOutput, JobRequirementsOutput } from "../schemas/skills";

// ── Input ─────────────────────────────────────────────────────────────────────

export interface GapAnalyzerInput {
  resumeSkills: SkillExtractionOutput;
  jobRequirements: JobRequirementsOutput;
  careerStage?: string;
}

// ── Signal Serializers ────────────────────────────────────────────────────────

function serializeResumeSignals(skills: SkillExtractionOutput): string {
  const lines: string[] = [];

  if (skills.skills.length)
    lines.push(`Skills: ${skills.skills.join(", ")}`);
  if (skills.technologies.length)
    lines.push(`Technologies: ${skills.technologies.join(", ")}`);
  if (skills.frameworks.length)
    lines.push(`Frameworks: ${skills.frameworks.join(", ")}`);
  if (skills.tools.length)
    lines.push(`Tools: ${skills.tools.join(", ")}`);
  if (skills.certifications.length)
    lines.push(`Certifications: ${skills.certifications.join(", ")}`);
  if (skills.methodologies.length)
    lines.push(`Methodologies: ${skills.methodologies.join(", ")}`);
  if (skills.softSkills.length)
    lines.push(`Soft Skills: ${skills.softSkills.join(", ")}`);

  return lines.join("\n") || "(No signals extracted)";
}

function serializeJobRequirements(reqs: JobRequirementsOutput): string {
  const lines: string[] = [];

  lines.push(`Seniority: ${reqs.seniority}`);
  if (reqs.yearsExperience !== null)
    lines.push(`Required Experience: ${reqs.yearsExperience} years`);
  if (reqs.requiredSkills.length)
    lines.push(`Required Skills: ${reqs.requiredSkills.join(", ")}`);
  if (reqs.preferredSkills.length)
    lines.push(`Preferred Skills: ${reqs.preferredSkills.join(", ")}`);
  if (reqs.frameworks.length)
    lines.push(`Frameworks: ${reqs.frameworks.join(", ")}`);
  if (reqs.tools.length)
    lines.push(`Tools: ${reqs.tools.join(", ")}`);
  if (reqs.certifications.length)
    lines.push(`Certifications: ${reqs.certifications.join(", ")}`);
  if (reqs.responsibilities.length)
    lines.push(
      `Key Responsibilities:\n${reqs.responsibilities
        .slice(0, 8)
        .map((r) => `  - ${r}`)
        .join("\n")}`
    );

  return lines.join("\n");
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * Runs AI gap analysis between resume signals and job requirements.
 * Uses DeepSeek-R1 for deep analytical reasoning.
 */
export async function analyzeGap(
  input: GapAnalyzerInput
): Promise<GapAnalysisOutput | null> {
  const resumeSignals = serializeResumeSignals(input.resumeSkills);
  const jobRequirements = serializeJobRequirements(input.jobRequirements);

  return openRouterClient.completeJson(
    {
      task: "gapAnalysis",
      system: GAP_ANALYZER_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildGapAnalysisPrompt({
            resumeSignals,
            jobRequirements,
            careerStage: input.careerStage,
          }),
        },
      ],
      temperature: 0.3,
    },
    GapAnalysisOutputSchema
  );
}

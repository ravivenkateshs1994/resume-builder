import { openRouterClient } from "./openrouter";
import { ROADMAP_SYSTEM_PROMPT, buildRoadmapPrompt } from "../prompts/roadmap";
import {
  CareerRoadmapOutputSchema,
  type CareerRoadmapOutput,
} from "../schemas/roadmap";
import type { GapAnalysisOutput } from "../schemas/gap";
import type { SkillExtractionOutput } from "../schemas/skills";

// ── Input ─────────────────────────────────────────────────────────────────────

export interface RoadmapGeneratorInput {
  targetRole: string;
  resumeSkills: SkillExtractionOutput;
  gapAnalysis: GapAnalysisOutput;
  careerStage?: string;
  /** Candidate-stated time availability, e.g. "10 hours/week". */
  timeConstraint?: string;
}

// ── Profile Serializer ────────────────────────────────────────────────────────

function serializeCurrentProfile(skills: SkillExtractionOutput): string {
  const allSkills = [
    ...skills.skills,
    ...skills.technologies,
    ...skills.frameworks,
    ...skills.tools,
    ...skills.methodologies,
  ];

  const lines: string[] = [`Skills: ${allSkills.join(", ") || "None listed"}`];

  if (skills.certifications.length) {
    lines.push(`Certifications: ${skills.certifications.join(", ")}`);
  }
  if (skills.softSkills.length) {
    lines.push(`Soft Skills: ${skills.softSkills.join(", ")}`);
  }

  return lines.join("\n");
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * Generates a phased career learning roadmap based on gap analysis results.
 * Uses DeepSeek-R1 for strategic planning depth.
 */
export async function generateRoadmap(
  input: RoadmapGeneratorInput
): Promise<CareerRoadmapOutput | null> {
  const criticalGaps = input.gapAnalysis.criticalGaps.map(
    (g) => `${g.skill} (${g.category}): ${g.reason}`
  );

  const importantGaps = input.gapAnalysis.importantGaps.map(
    (g) => `${g.skill} (${g.category}): ${g.reason}`
  );

  return openRouterClient.completeJson(
    {
      task: "roadmapGeneration",
      system: ROADMAP_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildRoadmapPrompt({
            targetRole: input.targetRole,
            currentProfile: serializeCurrentProfile(input.resumeSkills),
            criticalGaps,
            importantGaps,
            careerStage: input.careerStage,
            timeConstraint: input.timeConstraint,
          }),
        },
      ],
      temperature: 0.4,
    },
    CareerRoadmapOutputSchema
  );
}

import {
  generateRoadmap,
  type RoadmapGeneratorInput,
} from "../services/roadmap-generator";
import { resolveModel } from "../models/router";
import { runAgent, type Agent, type AgentResult } from "./types";
import type { CareerRoadmapOutput } from "../schemas/roadmap";
import type { GapAnalysisOutput } from "../schemas/gap";
import type { SkillExtractionOutput } from "../schemas/skills";

// ── Input ─────────────────────────────────────────────────────────────────────

export interface RoadmapAgentInput {
  targetRole: string;
  resumeSkills: SkillExtractionOutput;
  gapAnalysis: GapAnalysisOutput;
  careerStage?: string;
  timeConstraint?: string;
}

// ── Agent ─────────────────────────────────────────────────────────────────────

export const roadmapAgent: Agent<RoadmapAgentInput, CareerRoadmapOutput> = {
  name: "RoadmapAgent",
  task: "roadmapGeneration",
  description:
    "Generates a phased, resource-rich career learning roadmap from gap analysis results using DeepSeek-R1.",

  async run(
    input: RoadmapAgentInput
  ): Promise<AgentResult<CareerRoadmapOutput>> {
    return runAgent(
      () =>
        generateRoadmap({
          targetRole: input.targetRole,
          resumeSkills: input.resumeSkills,
          gapAnalysis: input.gapAnalysis,
          careerStage: input.careerStage,
          timeConstraint: input.timeConstraint,
        }),
      resolveModel("roadmapGeneration")
    );
  },
};

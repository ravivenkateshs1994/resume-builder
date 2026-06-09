import type { ParsedResumeOutput } from "../schemas/resume";
import type { SkillExtractionOutput, JobRequirementsOutput } from "../schemas/skills";
import type { GapAnalysisOutput } from "../schemas/gap";
import type { CareerRoadmapOutput } from "../schemas/roadmap";
import type { SkillExtractionAgentOutput } from "../agents/skill-extraction-agent";
import type { ATSAnalysisOutput } from "../agents/ats-analysis-agent";
import type { GapAnalysisAgentOutput } from "../agents/gap-analysis-agent";
import type { RoadmapGeneratorOutput } from "../agents/roadmap-generator-agent";
import type { NormalizedSkillInventory } from "../agents/skill-normalization-agent";

// ── Pipeline State ────────────────────────────────────────────────────────────
// Every field is optional — nodes read what they need and write their outputs.
// The graph executor merges partial state from each node into this root state.

export interface PipelineState {
  // ── Inputs (provided by caller before graph execution) ────────────────────
  rawResumeText?: string;
  jobDescription?: string;
  careerStage?: string;
  targetRole?: string;
  timeConstraint?: string;

  // ── Stage outputs (written by nodes) ─────────────────────────────────────
  parsedResume?: ParsedResumeOutput;
  /** Backward-compatible flat skill lists (consumed by GapAgent, ATS engine). */
  resumeSkills?: SkillExtractionOutput;
  /** Enriched categorized skills with proficiency signals (from SkillExtractionAgent). */
  enrichedSkills?: SkillExtractionAgentOutput;
  /** Canonicalized, deduplicated skill inventory (from SkillNormalizationAgent). Preferred by downstream agents. */
  normalizedSkills?: NormalizedSkillInventory;
  /** ATS compatibility score and keyword analysis (from ATSAnalysisAgent). */
  atsAnalysis?: ATSAnalysisOutput;
  /** Deep skill-gap analysis against a target role (from GapAnalysisAgent). */
  skillGapAnalysis?: GapAnalysisAgentOutput;
  /** Time-phased career roadmap generated from gap analysis (from RoadmapGeneratorAgent). */
  careerRoadmap?: RoadmapGeneratorOutput;
  jobRequirements?: JobRequirementsOutput;
  gapAnalysis?: GapAnalysisOutput;
  roadmap?: CareerRoadmapOutput;

  // ── Execution metadata ────────────────────────────────────────────────────
  /** All node errors accumulated during the run. Never throws — always appends. */
  errors: PipelineError[];
  /** Ordered list of node names that completed successfully. */
  completedNodes: string[];
  /** The currently executing node (for progress reporting). */
  currentNode?: string;
}

export interface PipelineError {
  node: string;
  message: string;
  timestamp: string;
}

// ── Initial State Factory ─────────────────────────────────────────────────────

export function createInitialState(
  inputs: Omit<PipelineState, "errors" | "completedNodes" | "currentNode">
): PipelineState {
  return {
    ...inputs,
    errors: [],
    completedNodes: [],
  };
}

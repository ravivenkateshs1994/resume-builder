import { resumeParserAgent } from "../agents/resume-parser-agent";
import { gapAgent } from "../agents/gap-agent";
import { roadmapAgent } from "../agents/roadmap-agent";
import type { PipelineState, PipelineError } from "./state";

// ── Node Function Type ────────────────────────────────────────────────────────

/**
 * A pipeline node receives the full current state and returns a partial
 * update that is shallowly merged into the state by the graph executor.
 */
export type NodeFn = (
  state: PipelineState
) => Promise<Partial<PipelineState>>;

// ── Error Helper ──────────────────────────────────────────────────────────────

function errorEntry(node: string, message: string): PipelineError {
  return { node, message, timestamp: new Date().toISOString() };
}

// ── Node: parseResume ─────────────────────────────────────────────────────────

/**
 * Parses raw resume text into structured data using Qwen3-235B via generateObject.
 * Uses ResumeParserAgent with 3-attempt retry and exponential backoff.
 *
 * Reads:  state.rawResumeText
 * Writes: state.parsedResume, state.targetRole
 */
export const parseResumeNode: NodeFn = (state) =>
  resumeParserAgent.runAsNode(state);

// ── Node: analyzeGap ──────────────────────────────────────────────────────────

/**
 * Extracts job requirements and performs gap analysis.
 *
 * Reads:  state.resumeSkills, state.jobDescription, state.careerStage
 * Writes: state.jobRequirements, state.gapAnalysis
 * Guard:  Skips if resumeSkills or jobDescription is absent.
 */
export const analyzeGapNode: NodeFn = async (state) => {
  if (!state.resumeSkills) {
    return {
      errors: [
        ...state.errors,
        errorEntry("analyzeGap", "resumeSkills not available — skipping gap analysis."),
      ],
    };
  }

  if (!state.jobDescription?.trim()) {
    return {
      errors: [
        ...state.errors,
        errorEntry("analyzeGap", "jobDescription not provided — skipping gap analysis."),
      ],
    };
  }

  const result = await gapAgent.run({
    jobDescription: state.jobDescription,
    resumeSkills: state.resumeSkills,
    careerStage: state.careerStage,
  });

  if (!result.success) {
    return {
      errors: [...state.errors, errorEntry("analyzeGap", result.error)],
    };
  }

  return {
    jobRequirements: result.data.jobRequirements,
    gapAnalysis: result.data.gapAnalysis,
  };
};

// ── Node: generateRoadmap ─────────────────────────────────────────────────────

/**
 * Generates a phased career learning roadmap from gap analysis output.
 *
 * Reads:  state.gapAnalysis, state.resumeSkills, state.targetRole
 * Writes: state.roadmap
 * Guard:  Skips if gapAnalysis or resumeSkills is absent.
 */
export const generateRoadmapNode: NodeFn = async (state) => {
  if (!state.gapAnalysis || !state.resumeSkills) {
    return {
      errors: [
        ...state.errors,
        errorEntry(
          "generateRoadmap",
          "gapAnalysis or resumeSkills not available — skipping roadmap generation."
        ),
      ],
    };
  }

  const targetRole =
    state.targetRole ||
    state.gapAnalysis.summary.split(" ").slice(0, 3).join(" ") ||
    "Target Role";

  const result = await roadmapAgent.run({
    targetRole,
    resumeSkills: state.resumeSkills,
    gapAnalysis: state.gapAnalysis,
    careerStage: state.careerStage,
    timeConstraint: state.timeConstraint,
  });

  if (!result.success) {
    return {
      errors: [...state.errors, errorEntry("generateRoadmap", result.error)],
    };
  }

  return { roadmap: result.data };
};

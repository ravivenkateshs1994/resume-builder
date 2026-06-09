export * from "./types";
export { resumeAgent } from "./resume-agent";
export { gapAgent } from "./gap-agent";
export { roadmapAgent, type RoadmapAgentInput } from "./roadmap-agent";
export {
  coachAgent,
  streamingCoachAgent,
  interviewPrepAgent,
  type InterviewPrepInput,
} from "./coach-agent";

// ── ResumeParserAgent (generateObject + Qwen3-235B + retry) ──────────────────
export {
  resumeParserAgent,
  resumeParserNode,
  ResumeParserAgent,
  ResumeParserError,
  ResumeParserOutputSchema,
} from "./resume-parser-agent";
export type {
  ResumeParserInput,
  ResumeParserOutput,
  ResumeParserResult,
  ResumeParserSuccess,
  ResumeParserFailure,
  ResumeParserErrorKind,
  ExperienceEntry,
  EducationEntry,
  PersonalInfo,
} from "./resume-parser-agent";
// ── SkillNormalizationAgent (deterministic, zero-latency, no API call) ──────────
export {
  skillNormalizationAgent,
  skillNormalizationNode,
  SkillNormalizationAgent,
  SkillNormalizationError,
} from "./skill-normalization-agent";
export type {
  NormalizedSkillInventory,
  SkillNormalizationResult,
  SkillNormalizationSuccess,
  SkillNormalizationFailure,
  SkillNormalizationErrorKind,
} from "./skill-normalization-agent";
// ── SkillExtractionAgent (generateObject + Qwen3-235B + retry) ───────────────
export {
  skillExtractionAgent,
  skillExtractionNode,
  SkillExtractionAgent,
  SkillExtractionError,
  SkillExtractionAgentOutputSchema,
} from "./skill-extraction-agent";
export type {
  SkillExtractionInput,
  SkillExtractionAgentOutput,
  SkillExtractionResult,
  SkillExtractionSuccess,
  SkillExtractionFailure,
  SkillExtractionErrorKind,
  SkillEntry,
} from "./skill-extraction-agent";

// ── GapAnalysisAgent (generateObject + DeepSeek R1 + retry) ─────────────────
export {
  gapAnalysisAgentInstance,
  gapAnalysisAgentNode,
  GapAnalysisAgent,
  GapAnalysisAgentError,
  GapAnalysisAgentOutputSchema,
} from "./gap-analysis-agent";
export type {
  GapAnalysisAgentInput,
  GapAnalysisAgentOutput,
  GapAnalysisAgentResult,
  GapAnalysisAgentSuccess,
  GapAnalysisAgentFailure,
  GapAnalysisAgentErrorKind,
  GapEntry,
  MarketDemandEntry,
} from "./gap-analysis-agent";

// ── ATSAnalysisAgent (generateObject + DeepSeek R1 + retry) ─────────────────
export {
  atsAnalysisAgent,
  atsAnalysisNode,
  ATSAnalysisAgent,
  ATSAnalysisError,
  ATSAnalysisOutputSchema,
} from "./ats-analysis-agent";
export type {
  ATSAnalysisInput,
  ATSAnalysisOutput,
  ATSAnalysisResult,
  ATSAnalysisSuccess,
  ATSAnalysisFailure,
  ATSAnalysisErrorKind,
} from "./ats-analysis-agent";

export type { ResumeAgentOutput } from "./resume-agent";
export type { GapAgentInput, GapAgentOutput } from "./gap-agent";

// ── RoadmapGeneratorAgent (generateObject + DeepSeek R1 + retry) ──────────────
export {
  roadmapGeneratorAgent,
  roadmapGeneratorNode,
  RoadmapGeneratorAgent,
  RoadmapGeneratorError,
  RoadmapGeneratorOutputSchema,
} from "./roadmap-generator-agent";
export type {
  RoadmapGeneratorInput,
  RoadmapGeneratorOutput,
  RoadmapGeneratorResult,
  RoadmapGeneratorSuccess,
  RoadmapGeneratorFailure,
  RoadmapGeneratorErrorKind,
  ActionItem,
  PhasePlan,
} from "./roadmap-generator-agent";

/**
 * @module src/lib/ai
 *
 * Career Readiness Platform — AI Architecture Layer
 *
 * Layered architecture:
 *
 *   models/    — Model IDs, capability registry, task-based router
 *   prompts/   — System prompts and prompt builders for each domain
 *   schemas/   — Zod v4 schemas for all AI inputs/outputs
 *   services/  — OpenRouter client + domain service functions
 *   agents/    — Typed single-responsibility agents wrapping services
 *   graphs/    — LangGraph-style stateful pipeline orchestrator
 *
 * Server-only. Never import from client components.
 */

// ── Models ────────────────────────────────────────────────────────────────────
// NOTE: ModelId, TaskName, ModelCapability are the authoritative copies from
// model-router.ts. The legacy models/types.ts versions are kept for the
// services/agents layers but not re-exported from the public barrel.
export type { CompletionRequest, CompletionResponse, StreamRequest, ChatMessage, MessageRole, ContentPart, ModelMetadata } from "./models/types";
export { MODEL_IDS, TASK_NAMES } from "./models/types";
export { MODEL_REGISTRY, getModelMetadata, modelHasCapability } from "./models/registry";
export { resolveModel, resolveModelWithFallback, getRoutingTable } from "./models/router";

// ── Prompts ───────────────────────────────────────────────────────────────────
export {
  RESUME_PARSER_SYSTEM_PROMPT,
  buildResumeParserPrompt,
} from "./prompts/resume-parser";

export {
  SKILL_EXTRACTOR_SYSTEM_PROMPT,
  JOB_REQUIREMENTS_SYSTEM_PROMPT,
  buildSkillExtractionPrompt,
  buildJobRequirementsPrompt,
} from "./prompts/skill-extractor";

export {
  GAP_ANALYZER_SYSTEM_PROMPT,
  buildGapAnalysisPrompt,
} from "./prompts/gap-analyzer";

export {
  ROADMAP_SYSTEM_PROMPT,
  buildRoadmapPrompt,
} from "./prompts/roadmap";

export {
  buildCareerCoachSystemPrompt,
  buildCoachContextBlock,
  INTERVIEW_PREP_SYSTEM_PROMPT,
  buildInterviewPrepPrompt,
} from "./prompts/career-coach";

// ── Schemas ───────────────────────────────────────────────────────────────────
export type { ParsedResumeOutput, ParsedWorkExperience, ParsedEducation, ParsedCertification, ParsedPersonalInfo } from "./schemas/resume";
export { ParsedResumeSchema } from "./schemas/resume";

export type { SkillExtractionOutput, JobRequirementsOutput, JobSeniority } from "./schemas/skills";
export { SkillExtractionOutputSchema, JobRequirementsSchema } from "./schemas/skills";

export type { GapAnalysisOutput, SkillGap, GapSeverity, HiringProbability } from "./schemas/gap";
export { GapAnalysisOutputSchema } from "./schemas/gap";

export type { CareerRoadmapOutput, RoadmapPhase, RoadmapResource } from "./schemas/roadmap";
export { CareerRoadmapOutputSchema } from "./schemas/roadmap";

export type { CoachMessage, CoachContext, CoachRequest, InterviewPrepOutput, InterviewQuestion } from "./schemas/coach";
export { CoachRequestSchema } from "./schemas/coach";

// ── Services ──────────────────────────────────────────────────────────────────
export { openRouterClient } from "./services/openrouter";
export { parseResumeWithAI } from "./services/resume-parser";
export { extractResumeSkills, extractJobRequirements } from "./services/skill-extractor";
export { analyzeGap } from "./services/gap-analyzer";
export { generateRoadmap } from "./services/roadmap-generator";
export { getCoachResponse, streamCoachResponse, generateInterviewQuestions } from "./services/career-coach";

export type { ResumeParserInput } from "./services/resume-parser";
export type { GapAnalyzerInput } from "./services/gap-analyzer";
export type { RoadmapGeneratorInput } from "./services/roadmap-generator";

// ── Agents ────────────────────────────────────────────────────────────────────
export type { Agent, AgentResult } from "./agents/types";
export { runAgent } from "./agents/types";
export { resumeAgent } from "./agents/resume-agent";
export { gapAgent } from "./agents/gap-agent";
export { roadmapAgent } from "./agents/roadmap-agent";
export { coachAgent, streamingCoachAgent, interviewPrepAgent } from "./agents/coach-agent";

export type { ResumeAgentOutput } from "./agents/resume-agent";
export type { GapAgentInput, GapAgentOutput } from "./agents/gap-agent";
export type { RoadmapAgentInput } from "./agents/roadmap-agent";
export type { InterviewPrepInput } from "./agents/coach-agent";

// ── Model Router (production) ─────────────────────────────────────────────────
export {
  modelRouter,
  ModelRouter,
  ModelRouterError,
  routeCompletion,
  routeJson,
  routeStream,
  MODEL_SPECS,
  TASK_ROUTES,
  OPENROUTER_PROVIDER,
} from "./model-router";
export type {
  ModelId,
  TaskName,
  ModelSpec,
  TaskRouteConfig,
  RoutingDecision,
  RouterCompletionResult,
  RouterCallOptions,
  RouterMessage,
  FailoverReason,
  ModelCapability,
  ProviderConfig,
} from "./model-router";

// ── Graph Pipeline ────────────────────────────────────────────────────────────
export type { PipelineState, PipelineError } from "./graphs/state";
export { createInitialState } from "./graphs/state";
export { careerPipeline, runCareerPipeline, PipelineGraphBuilder, CompiledPipelineGraph } from "./graphs/pipeline";

/**
 * CareerReadinessGraph
 *
 * Complete 6-node LangGraph-style pipeline for the Career Readiness Platform.
 *
 * Node execution order (sequential, dependency-resolved):
 *
 *   START
 *    │
 *    ▼
 *   [parseResume]         ResumeParserAgent   — rawResumeText → parsedResume
 *    │
 *    ▼
 *   [extractSkills]       SkillExtractionAgent — parsedResume → enrichedSkills
 *    │
 *    ▼
 *   [normalizeSkills]     SkillNormalizationAgent — enrichedSkills → normalizedSkills (sync, zero-latency)
 *    │
 *    ├──────────────────────────────────────────────────────────────────────┐
 *    ▼                                                                      ▼
 *   [atsAnalysis]         ATSAnalysisAgent         [gapAnalysis]  GapAnalysisAgent
 *   parsedResume+JD → atsAnalysis          normalizedSkills+role → skillGapAnalysis
 *    │                                                                      │
 *    └──────────────────────────────────────────────────────────────────────┘
 *                                 │
 *                                 ▼
 *                      [generateRoadmap]    RoadmapGeneratorAgent
 *                      skillGapAnalysis+role → careerRoadmap
 *                                 │
 *                                END
 *
 * Architecture principles:
 *  • Typed state (PipelineState) — every field is optional; nodes merge partial updates
 *  • Error recovery — node failures append to state.errors but never throw; graph continues
 *  • Retry policies — each AI agent has its own 3-attempt retry with model-advance failover
 *  • Node isolation — each node receives a state snapshot and returns a partial update
 *  • Parallel execution — ATSAnalysis and GapAnalysis run concurrently after SkillNormalization
 *  • Extensibility — CareerReadinessGraphBuilder exposes addNode() for custom nodes
 *  • Observability — per-node timing, status, error count; onNodeStart/onNodeComplete/onError hooks
 *  • Streaming — stream() yields typed GraphEvent objects as each node completes
 *
 * Server-only. Never import from client components.
 */

import {
  createInitialState,
  type PipelineState,
  type PipelineError,
} from "./state";
import type { NodeFn } from "./nodes";
import { resumeParserNode } from "../agents/resume-parser-agent";
import { skillExtractionNode } from "../agents/skill-extraction-agent";
import { skillNormalizationNode } from "../agents/skill-normalization-agent";
import { atsAnalysisNode } from "../agents/ats-analysis-agent";
import { gapAnalysisAgentNode } from "../agents/gap-analysis-agent";
import { roadmapGeneratorNode } from "../agents/roadmap-generator-agent";

// ─────────────────────────────────────────────────────────────────────────────
// § 1 — NODE DESCRIPTOR
// ─────────────────────────────────────────────────────────────────────────────

export type ExecutionMode = "sequential" | "parallel";

export interface GraphNodeDescriptor {
  /** Unique name used in dependency declarations and execution traces. */
  name: string;
  /** The node function to execute. */
  fn: NodeFn;
  /**
   * Node names that must complete before this node can start.
   * Dependencies form a DAG — cycles are rejected at compile time.
   */
  dependencies: string[];
  /**
   * Optional guard: if this returns false the node is skipped without error.
   * Use for optional pipeline stages that require certain inputs.
   */
  guard?: (state: PipelineState) => boolean;
  /**
   * Maximum milliseconds to wait for this node's fn() to resolve.
   * If exceeded the node is marked "timeout" and its error is appended to state.
   * Overrides graph-level nodeTimeoutMs.
   */
  timeoutMs?: number;
  /**
   * When true, a node failure (unhandled throw or timeout) immediately
   * stops the graph execution, overriding graph-level stopOnError.
   */
  fatal?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2 — EXECUTION TRACE
// ─────────────────────────────────────────────────────────────────────────────

export type NodeStatus = "pending" | "running" | "completed" | "skipped" | "failed" | "timeout";

export interface NodeTrace {
  /** Node name. */
  name: string;
  status: NodeStatus;
  /** ISO timestamp when execution started (undefined if skipped before start). */
  startedAt?: string;
  /** Wall-clock duration from node start to completion/failure. */
  durationMs?: number;
  /** Number of PipelineErrors appended by this node. */
  errorCount: number;
  /** Human-readable error message if status is "failed" or "timeout". */
  errorMessage?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3 — GRAPH RESULT
// ─────────────────────────────────────────────────────────────────────────────

export interface GraphResult {
  /** Final merged pipeline state after all nodes have run. */
  state: PipelineState;
  /** Per-node execution metadata in topological order. */
  executionTrace: NodeTrace[];
  /** Total wall-clock duration from invoke() call to return. */
  totalDurationMs: number;
  /**
   * True if all nodes that could run completed without errors.
   * A graph with skipped optional nodes can still be "successful".
   */
  success: boolean;
  /** Names of nodes that successfully wrote output to state. */
  completedNodes: string[];
  /** Names of nodes that were skipped due to guard conditions. */
  skippedNodes: string[];
  /** Names of nodes that produced errors. */
  failedNodes: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4 — STREAMING EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export type GraphEventKind =
  | "graph_started"
  | "node_started"
  | "node_completed"
  | "node_skipped"
  | "node_failed"
  | "node_timeout"
  | "graph_completed";

export interface GraphEventBase {
  kind: GraphEventKind;
  timestamp: string;
  totalElapsedMs: number;
}

export interface GraphStartedEvent extends GraphEventBase {
  kind: "graph_started";
  nodeCount: number;
}

export interface NodeStartedEvent extends GraphEventBase {
  kind: "node_started";
  nodeName: string;
  dependenciesCompleted: string[];
}

export interface NodeCompletedEvent extends GraphEventBase {
  kind: "node_completed";
  nodeName: string;
  durationMs: number;
  errorCount: number;
  /** Partial state keys written by this node. */
  stateKeysWritten: string[];
}

export interface NodeSkippedEvent extends GraphEventBase {
  kind: "node_skipped";
  nodeName: string;
  reason: "guard_failed" | "dependency_failed";
}

export interface NodeFailedEvent extends GraphEventBase {
  kind: "node_failed";
  nodeName: string;
  durationMs: number;
  message: string;
}

export interface NodeTimeoutEvent extends GraphEventBase {
  kind: "node_timeout";
  nodeName: string;
  timeoutMs: number;
}

export interface GraphCompletedEvent extends GraphEventBase {
  kind: "graph_completed";
  totalDurationMs: number;
  success: boolean;
  completedNodes: string[];
  skippedNodes: string[];
  failedNodes: string[];
}

export type GraphEvent =
  | GraphStartedEvent
  | NodeStartedEvent
  | NodeCompletedEvent
  | NodeSkippedEvent
  | NodeFailedEvent
  | NodeTimeoutEvent
  | GraphCompletedEvent;

// ─────────────────────────────────────────────────────────────────────────────
// § 5 — GRAPH CONFIG
// ─────────────────────────────────────────────────────────────────────────────

export interface CareerReadinessGraphConfig {
  /**
   * Maximum milliseconds any single node may run before it is cancelled.
   * Individual nodes can override with nodeDescriptor.timeoutMs.
   * Default: 120_000 (2 minutes).
   */
  nodeTimeoutMs?: number;
  /**
   * When true, the first node failure stops graph execution immediately.
   * Default: false (non-fatal errors accumulate and the graph continues).
   */
  stopOnError?: boolean;
  /** Called synchronously before each node's fn() is invoked. */
  onNodeStart?: (name: string, state: PipelineState) => void;
  /** Called synchronously after each node completes (success or skipped). */
  onNodeComplete?: (name: string, state: PipelineState, trace: NodeTrace) => void;
  /** Called when a node fails (either throws or times out). */
  onNodeError?: (name: string, error: PipelineError, state: PipelineState) => void;
  /** Called once when the graph finishes (success or partial). */
  onGraphComplete?: (result: GraphResult) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 6 — GRAPH COMPILER (internal)
// ─────────────────────────────────────────────────────────────────────────────

function validateGraph(nodes: GraphNodeDescriptor[]): void {
  const names = new Set(nodes.map((n) => n.name));

  for (const node of nodes) {
    for (const dep of node.dependencies) {
      if (!names.has(dep)) {
        throw new Error(
          `CareerReadinessGraph validation error: ` +
            `Node "${node.name}" declares unknown dependency "${dep}".`
        );
      }
    }
  }
}

function topologicalSort(nodes: GraphNodeDescriptor[]): GraphNodeDescriptor[] {
  const sorted: GraphNodeDescriptor[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const nodeMap = new Map(nodes.map((n) => [n.name, n]));

  const visit = (name: string): void => {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      throw new Error(
        `CareerReadinessGraph cycle detected at node "${name}". ` +
          `Pipeline graphs must be acyclic.`
      );
    }
    visiting.add(name);
    const node = nodeMap.get(name)!;
    for (const dep of node.dependencies) visit(dep);
    visiting.delete(name);
    visited.add(name);
    sorted.push(node);
  };

  for (const node of nodes) visit(node.name);
  return sorted;
}

/** Group nodes into execution waves — all nodes in a wave can run in parallel. */
function buildExecutionWaves(
  nodes: GraphNodeDescriptor[]
): GraphNodeDescriptor[][] {
  const sorted = topologicalSort(nodes);
  const waves: GraphNodeDescriptor[][] = [];
  const completedSet = new Set<string>();

  while (sorted.length > completedSet.size) {
    const wave: GraphNodeDescriptor[] = [];

    for (const node of sorted) {
      if (completedSet.has(node.name)) continue;
      const depsAllDone = node.dependencies.every((d) => completedSet.has(d));
      if (depsAllDone) wave.push(node);
    }

    if (wave.length === 0) {
      throw new Error(
        "CareerReadinessGraph: could not make progress — check for unresolvable dependencies."
      );
    }

    waves.push(wave);
    for (const n of wave) completedSet.add(n.name);
  }

  return waves;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 7 — NODE EXECUTION WITH TIMEOUT
// ─────────────────────────────────────────────────────────────────────────────

async function runWithTimeout(
  fn: NodeFn,
  state: PipelineState,
  timeoutMs: number
): Promise<{ partial: Partial<PipelineState>; timedOut: false } | { timedOut: true }> {
  const nodePromise = fn(state);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`__TIMEOUT__${timeoutMs}`)), timeoutMs)
  );

  try {
    const partial = await Promise.race([nodePromise, timeoutPromise]);
    return { partial, timedOut: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith("__TIMEOUT__")) return { timedOut: true };
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 8 — COMPILED GRAPH
// ─────────────────────────────────────────────────────────────────────────────

export class CompiledCareerReadinessGraph {
  private readonly waves: GraphNodeDescriptor[][];
  private readonly nodeMap: Map<string, GraphNodeDescriptor>;

  constructor(
    nodes: GraphNodeDescriptor[],
    private readonly config: Required<
      Omit<CareerReadinessGraphConfig, "onNodeStart" | "onNodeComplete" | "onNodeError" | "onGraphComplete">
    > &
      Pick<CareerReadinessGraphConfig, "onNodeStart" | "onNodeComplete" | "onNodeError" | "onGraphComplete">
  ) {
    validateGraph(nodes);
    this.waves = buildExecutionWaves(nodes);
    this.nodeMap = new Map(nodes.map((n) => [n.name, n]));
  }

  // ── invoke() ────────────────────────────────────────────────────────────────

  async invoke(
    inputs: Omit<PipelineState, "errors" | "completedNodes" | "currentNode">
  ): Promise<GraphResult> {
    const globalStart = Date.now();
    let state = createInitialState(inputs);
    const traceMap = new Map<string, NodeTrace>();
    const skippedNodes: string[] = [];
    const failedNodes: string[] = [];
    const failedNodeSet = new Set<string>();
    let stopped = false;

    // Initialise trace entries
    for (const [name] of this.nodeMap) {
      traceMap.set(name, { name, status: "pending", errorCount: 0 });
    }

    for (const wave of this.waves) {
      if (stopped) break;

      // Run all nodes in this wave in parallel
      const waveResults = await Promise.all(
        wave.map(async (node) => {
          // Skip if any dependency failed
          const depFailed = node.dependencies.some((d) => failedNodeSet.has(d));
          if (depFailed) {
            const trace: NodeTrace = {
              name: node.name,
              status: "skipped",
              errorCount: 0,
            };
            traceMap.set(node.name, trace);
            skippedNodes.push(node.name);
            return { node, partial: {} as Partial<PipelineState>, trace };
          }

          // Evaluate guard
          if (node.guard && !node.guard(state)) {
            const trace: NodeTrace = {
              name: node.name,
              status: "skipped",
              errorCount: 0,
            };
            traceMap.set(node.name, trace);
            skippedNodes.push(node.name);
            return { node, partial: {} as Partial<PipelineState>, trace };
          }

          // Start
          const nodeStart = Date.now();
          const startedAt = new Date().toISOString();
          traceMap.set(node.name, {
            name: node.name,
            status: "running",
            startedAt,
            errorCount: 0,
          });
          this.config.onNodeStart?.(node.name, state);

          const effectiveTimeout = node.timeoutMs ?? this.config.nodeTimeoutMs;

          try {
            const outcome = await runWithTimeout(node.fn, state, effectiveTimeout);
            const durationMs = Date.now() - nodeStart;

            if (outcome.timedOut) {
              const errEntry: PipelineError = {
                node: node.name,
                message: `Node timed out after ${effectiveTimeout}ms.`,
                timestamp: new Date().toISOString(),
              };
              const trace: NodeTrace = {
                name: node.name,
                status: "timeout",
                startedAt,
                durationMs,
                errorCount: 1,
                errorMessage: errEntry.message,
              };
              traceMap.set(node.name, trace);
              failedNodes.push(node.name);
              failedNodeSet.add(node.name);
              this.config.onNodeError?.(node.name, errEntry, state);

              const partial: Partial<PipelineState> = {
                errors: [...state.errors, errEntry],
              };
              return { node, partial, trace };
            }

            // Measure errors added by this node
            const prevErrorCount = state.errors.length;
            const newErrorCount = (outcome.partial.errors ?? state.errors).length;
            const errorCount = Math.max(0, newErrorCount - prevErrorCount);

            const trace: NodeTrace = {
              name: node.name,
              status: errorCount > 0 ? "failed" : "completed",
              startedAt,
              durationMs,
              errorCount,
              errorMessage:
                errorCount > 0
                  ? (outcome.partial.errors ?? state.errors).slice(-errorCount)[0]?.message
                  : undefined,
            };
            traceMap.set(node.name, trace);

            if (errorCount > 0) {
              failedNodes.push(node.name);
              failedNodeSet.add(node.name);
              this.config.onNodeError?.(
                node.name,
                (outcome.partial.errors ?? state.errors).slice(-1)[0]!,
                state
              );
              if (node.fatal || this.config.stopOnError) stopped = true;
            }

            this.config.onNodeComplete?.(node.name, state, trace);
            return { node, partial: outcome.partial, trace };
          } catch (err) {
            const durationMs = Date.now() - nodeStart;
            const message =
              err instanceof Error ? err.message : String(err);
            const errEntry: PipelineError = {
              node: node.name,
              message,
              timestamp: new Date().toISOString(),
            };
            const trace: NodeTrace = {
              name: node.name,
              status: "failed",
              startedAt,
              durationMs,
              errorCount: 1,
              errorMessage: message,
            };
            traceMap.set(node.name, trace);
            failedNodes.push(node.name);
            failedNodeSet.add(node.name);
            this.config.onNodeError?.(node.name, errEntry, state);
            if (node.fatal || this.config.stopOnError) stopped = true;
            return {
              node,
              partial: { errors: [...state.errors, errEntry] },
              trace,
            };
          }
        })
      );

      // Merge wave results into state sequentially (order within wave is stable)
      for (const { node, partial, trace } of waveResults) {
        const prevErrors = state.errors;
        state = {
          ...state,
          ...partial,
          errors: partial.errors ?? state.errors,
          completedNodes:
            trace.status === "completed"
              ? [...state.completedNodes, node.name]
              : state.completedNodes,
        };
        void prevErrors; // used indirectly above
      }
    }

    state = { ...state, currentNode: undefined };

    const totalDurationMs = Date.now() - globalStart;
    const executionTrace = topologicalSort(Array.from(this.nodeMap.values())).map(
      (n) => traceMap.get(n.name)!
    );

    const result: GraphResult = {
      state,
      executionTrace,
      totalDurationMs,
      success: failedNodes.length === 0 && !stopped,
      completedNodes: state.completedNodes,
      skippedNodes,
      failedNodes,
    };

    this.config.onGraphComplete?.(result);
    return result;
  }

  // ── stream() ─────────────────────────────────────────────────────────────────

  /**
   * Streaming variant — yields a typed GraphEvent as each node starts/completes.
   * Consumers can use this to drive real-time progress UI.
   *
   * @example
   * ```ts
   * for await (const event of careerReadinessGraph.stream(inputs)) {
   *   if (event.kind === "node_completed") {
   *     console.log(`✓ ${event.nodeName} (${event.durationMs}ms)`);
   *   }
   *   if (event.kind === "graph_completed") {
   *     const result = event; // final summary
   *   }
   * }
   * ```
   */
  async *stream(
    inputs: Omit<PipelineState, "errors" | "completedNodes" | "currentNode">
  ): AsyncGenerator<GraphEvent> {
    const globalStart = Date.now();
    let state = createInitialState(inputs);
    const failedNodeSet = new Set<string>();
    const skippedNodes: string[] = [];
    const failedNodes: string[] = [];
    let stopped = false;

    const elapsed = () => Date.now() - globalStart;

    yield {
      kind: "graph_started",
      timestamp: new Date().toISOString(),
      totalElapsedMs: elapsed(),
      nodeCount: this.nodeMap.size,
    } satisfies GraphStartedEvent;

    for (const wave of this.waves) {
      if (stopped) break;

      // Collect per-wave events — we need to yield them after each node settles
      const waveEventBatches: { events: GraphEvent[]; partial: Partial<PipelineState>; nodeName: string; status: NodeStatus }[] = [];

      await Promise.all(
        wave.map(async (node) => {
          const events: GraphEvent[] = [];

          const depFailed = node.dependencies.some((d) => failedNodeSet.has(d));
          if (depFailed || (node.guard && !node.guard(state))) {
            events.push({
              kind: "node_skipped",
              timestamp: new Date().toISOString(),
              totalElapsedMs: elapsed(),
              nodeName: node.name,
              reason: depFailed ? "dependency_failed" : "guard_failed",
            } satisfies NodeSkippedEvent);
            skippedNodes.push(node.name);
            waveEventBatches.push({ events, partial: {}, nodeName: node.name, status: "skipped" });
            return;
          }

          events.push({
            kind: "node_started",
            timestamp: new Date().toISOString(),
            totalElapsedMs: elapsed(),
            nodeName: node.name,
            dependenciesCompleted: node.dependencies,
          } satisfies NodeStartedEvent);

          const nodeStart = Date.now();
          const effectiveTimeout = node.timeoutMs ?? this.config.nodeTimeoutMs;

          try {
            const outcome = await runWithTimeout(node.fn, state, effectiveTimeout);
            const durationMs = Date.now() - nodeStart;

            if (outcome.timedOut) {
              events.push({
                kind: "node_timeout",
                timestamp: new Date().toISOString(),
                totalElapsedMs: elapsed(),
                nodeName: node.name,
                timeoutMs: effectiveTimeout,
              } satisfies NodeTimeoutEvent);
              failedNodes.push(node.name);
              failedNodeSet.add(node.name);
              if (node.fatal || this.config.stopOnError) stopped = true;
              waveEventBatches.push({
                events,
                partial: {
                  errors: [
                    ...state.errors,
                    {
                      node: node.name,
                      message: `Node timed out after ${effectiveTimeout}ms.`,
                      timestamp: new Date().toISOString(),
                    },
                  ],
                },
                nodeName: node.name,
                status: "timeout",
              });
              return;
            }

            const prevErrorCount = state.errors.length;
            const newErrors = outcome.partial.errors ?? state.errors;
            const errorCount = Math.max(0, newErrors.length - prevErrorCount);
            const stateKeysWritten = Object.keys(outcome.partial).filter(
              (k) => k !== "errors" && k !== "completedNodes"
            );

            events.push({
              kind: "node_completed",
              timestamp: new Date().toISOString(),
              totalElapsedMs: elapsed(),
              nodeName: node.name,
              durationMs,
              errorCount,
              stateKeysWritten,
            } satisfies NodeCompletedEvent);

            if (errorCount > 0) {
              failedNodes.push(node.name);
              failedNodeSet.add(node.name);
              if (node.fatal || this.config.stopOnError) stopped = true;
            }

            waveEventBatches.push({ events, partial: outcome.partial, nodeName: node.name, status: errorCount > 0 ? "failed" : "completed" });
          } catch (err) {
            const durationMs = Date.now() - nodeStart;
            const message = err instanceof Error ? err.message : String(err);
            events.push({
              kind: "node_failed",
              timestamp: new Date().toISOString(),
              totalElapsedMs: elapsed(),
              nodeName: node.name,
              durationMs,
              message,
            } satisfies NodeFailedEvent);
            failedNodes.push(node.name);
            failedNodeSet.add(node.name);
            if (node.fatal || this.config.stopOnError) stopped = true;
            waveEventBatches.push({
              events,
              partial: {
                errors: [
                  ...state.errors,
                  { node: node.name, message, timestamp: new Date().toISOString() },
                ],
              },
              nodeName: node.name,
              status: "failed",
            });
          }
        })
      );

      // Yield events and merge state in stable topological order within wave
      for (const { events, partial, nodeName, status } of waveEventBatches) {
        for (const event of events) yield event;

        state = {
          ...state,
          ...partial,
          errors: partial.errors ?? state.errors,
          completedNodes:
            status === "completed"
              ? [...state.completedNodes, nodeName]
              : state.completedNodes,
        };
      }
    }

    const totalDurationMs = Date.now() - globalStart;

    yield {
      kind: "graph_completed",
      timestamp: new Date().toISOString(),
      totalElapsedMs: totalDurationMs,
      totalDurationMs,
      success: failedNodes.length === 0 && !stopped,
      completedNodes: state.completedNodes,
      skippedNodes,
      failedNodes,
    } satisfies GraphCompletedEvent;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 9 — GRAPH BUILDER
// ─────────────────────────────────────────────────────────────────────────────

export class CareerReadinessGraphBuilder {
  private nodes: GraphNodeDescriptor[] = [];
  private config: CareerReadinessGraphConfig = {};

  addNode(node: GraphNodeDescriptor): this {
    if (this.nodes.some((n) => n.name === node.name)) {
      throw new Error(
        `CareerReadinessGraphBuilder: duplicate node name "${node.name}".`
      );
    }
    this.nodes.push(node);
    return this;
  }

  configure(config: CareerReadinessGraphConfig): this {
    this.config = { ...this.config, ...config };
    return this;
  }

  compile(): CompiledCareerReadinessGraph {
    return new CompiledCareerReadinessGraph(this.nodes, {
      nodeTimeoutMs: this.config.nodeTimeoutMs ?? 120_000,
      stopOnError: this.config.stopOnError ?? false,
      onNodeStart: this.config.onNodeStart,
      onNodeComplete: this.config.onNodeComplete,
      onNodeError: this.config.onNodeError,
      onGraphComplete: this.config.onGraphComplete,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// § 10 — DEFAULT 6-NODE CAREER READINESS GRAPH
//
//  parseResume → extractSkills → normalizeSkills → [atsAnalysis ∥ gapAnalysis] → generateRoadmap
//
// Node descriptors are extracted into a constant so they can be reused by
// runCareerReadinessPipeline without duplication.
// ─────────────────────────────────────────────────────────────────────────────

/** Canonical pipeline node descriptors. Single source of truth for both the
 *  default compiled graph and the configurable runner. */
const PIPELINE_NODES: GraphNodeDescriptor[] = [
  {
    name: "parseResume",
    fn: resumeParserNode,
    dependencies: [],
    guard: (state) => Boolean(state.rawResumeText?.trim()),
    timeoutMs: 90_000,
    fatal: true, // Nothing can run without a parsed resume
  },
  {
    name: "extractSkills",
    fn: skillExtractionNode,
    dependencies: ["parseResume"],
    guard: (state) => Boolean(state.parsedResume),
    timeoutMs: 90_000,
  },
  {
    name: "normalizeSkills",
    fn: skillNormalizationNode,
    dependencies: ["extractSkills"],
    guard: (state) => Boolean(state.enrichedSkills),
    timeoutMs: 5_000,
  },
  {
    name: "atsAnalysis",
    fn: atsAnalysisNode,
    dependencies: ["normalizeSkills"],
    guard: (state) =>
      Boolean(state.parsedResume) && Boolean(state.jobDescription?.trim()),
    timeoutMs: 120_000,
  },
  {
    name: "gapAnalysis",
    fn: gapAnalysisAgentNode,
    dependencies: ["normalizeSkills"],
    guard: (state) =>
      Boolean(state.normalizedSkills ?? state.enrichedSkills) &&
      Boolean(state.targetRole?.trim()),
    timeoutMs: 120_000,
  },
  {
    name: "generateRoadmap",
    fn: roadmapGeneratorNode,
    dependencies: ["gapAnalysis"],
    guard: (state) =>
      Boolean(state.skillGapAnalysis) && Boolean(state.targetRole?.trim()),
    timeoutMs: 150_000,
  },
];

/** Default compiled graph. Import this for direct use without custom config. */
export const careerReadinessGraph = (() => {
  const builder = new CareerReadinessGraphBuilder();
  for (const node of PIPELINE_NODES) builder.addNode(node);
  return builder.compile();
})();

// ─────────────────────────────────────────────────────────────────────────────
// § 11 — CONVENIENCE RUNNERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run the complete 6-node career readiness pipeline and return the full result.
 *
 * @example
 * ```ts
 * const result = await runCareerReadinessPipeline({
 *   rawResumeText: "...",
 *   jobDescription: "...",
 *   targetRole: "Senior Backend Engineer",
 *   careerStage: "mid-level",
 * });
 *
 * if (result.success) {
 *   console.log(result.state.careerRoadmap);
 * }
 * ```
 */
export async function runCareerReadinessPipeline(
  inputs: Omit<PipelineState, "errors" | "completedNodes" | "currentNode">,
  config?: CareerReadinessGraphConfig
): Promise<GraphResult> {
  if (!config) return careerReadinessGraph.invoke(inputs);

  // Build a fresh graph with the caller-supplied config applied over the
  // canonical node set — no node descriptor duplication required.
  const builder = new CareerReadinessGraphBuilder().configure(config);
  for (const node of PIPELINE_NODES) builder.addNode(node);
  return builder.compile().invoke(inputs);
}

/**
 * Stream the 6-node pipeline, yielding a GraphEvent for each state transition.
 * Use this to drive real-time progress UI (e.g. server-sent events, WebSockets).
 *
 * @example
 * ```ts
 * // In a Next.js Route Handler:
 * const encoder = new TextEncoder();
 * const stream = new ReadableStream({
 *   async start(controller) {
 *     for await (const event of streamCareerReadinessPipeline(inputs)) {
 *       controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
 *       if (event.kind === "graph_completed") controller.close();
 *     }
 *   },
 * });
 * return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
 * ```
 */
export function streamCareerReadinessPipeline(
  inputs: Omit<PipelineState, "errors" | "completedNodes" | "currentNode">
): AsyncGenerator<GraphEvent> {
  return careerReadinessGraph.stream(inputs);
}

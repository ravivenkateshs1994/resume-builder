import { parseResumeNode, analyzeGapNode, generateRoadmapNode, type NodeFn } from "./nodes";
import { skillExtractionNode } from "../agents/skill-extraction-agent";
import { createInitialState, type PipelineState } from "./state";

// ── Graph Node Descriptor ─────────────────────────────────────────────────────

interface GraphNode {
  name: string;
  fn: NodeFn;
  /** Node names that must complete before this node can run. */
  dependencies: string[];
  /**
   * Optional guard: if the function returns false, the node is skipped
   * without recording an error.
   */
  guard?: (state: PipelineState) => boolean;
}

// ── Graph Builder ─────────────────────────────────────────────────────────────

class PipelineGraphBuilder {
  private nodes: GraphNode[] = [];

  addNode(node: GraphNode): this {
    this.nodes.push(node);
    return this;
  }

  compile(): CompiledPipelineGraph {
    return new CompiledPipelineGraph(this.nodes);
  }
}

// ── Compiled Graph ────────────────────────────────────────────────────────────

class CompiledPipelineGraph {
  constructor(private readonly nodes: GraphNode[]) {
    this.validateDependencies();
  }

  private validateDependencies(): void {
    const names = new Set(this.nodes.map((n) => n.name));
    for (const node of this.nodes) {
      for (const dep of node.dependencies) {
        if (!names.has(dep)) {
          throw new Error(
            `Graph validation error: Node "${node.name}" has unknown dependency "${dep}".`
          );
        }
      }
    }
  }

  /** Topologically sort nodes respecting dependency order. */
  private topologicalSort(): GraphNode[] {
    const sorted: GraphNode[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const nodeMap = new Map(this.nodes.map((n) => [n.name, n]));

    const visit = (name: string): void => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(
          `Cycle detected in pipeline graph at node "${name}".`
        );
      }

      visiting.add(name);
      const node = nodeMap.get(name)!;
      for (const dep of node.dependencies) {
        visit(dep);
      }
      visiting.delete(name);
      visited.add(name);
      sorted.push(node);
    };

    for (const node of this.nodes) {
      visit(node.name);
    }

    return sorted;
  }

  /**
   * Execute the pipeline sequentially in dependency order.
   * Each node's partial output is merged into the state before the next runs.
   */
  async invoke(
    inputs: Omit<PipelineState, "errors" | "completedNodes" | "currentNode">,
    options?: {
      /** Called after each node completes (for progress streaming). */
      onNodeComplete?: (nodeName: string, state: PipelineState) => void;
    }
  ): Promise<PipelineState> {
    let state = createInitialState(inputs);
    const executionOrder = this.topologicalSort();

    for (const node of executionOrder) {
      // Check guard condition
      if (node.guard && !node.guard(state)) {
        continue;
      }

      state = { ...state, currentNode: node.name };

      const partial = await node.fn(state);

      // Merge arrays additively so errors/completedNodes accumulate
      state = {
        ...state,
        ...partial,
        errors: partial.errors ?? state.errors,
        completedNodes:
          partial.errors && partial.errors.length > state.errors.length
            ? state.completedNodes // Error occurred — don't mark as complete
            : [...state.completedNodes, node.name],
      };

      options?.onNodeComplete?.(node.name, state);
    }

    return { ...state, currentNode: undefined };
  }
}

// ── Default Career Pipeline ────────────────────────────────────────────────────
//
// parseResume → extractSkills → analyzeGap → generateRoadmap

export const careerPipeline = new PipelineGraphBuilder()
  .addNode({
    name: "parseResume",
    fn: parseResumeNode,
    dependencies: [],
    guard: (state) => Boolean(state.rawResumeText?.trim()),
  })
  .addNode({
    name: "extractSkills",
    fn: skillExtractionNode,
    dependencies: ["parseResume"],
    guard: (state) => Boolean(state.parsedResume),
  })
  .addNode({
    name: "analyzeGap",
    fn: analyzeGapNode,
    dependencies: ["extractSkills"],
    guard: (state) =>
      Boolean(state.resumeSkills) && Boolean(state.jobDescription?.trim()),
  })
  .addNode({
    name: "generateRoadmap",
    fn: generateRoadmapNode,
    dependencies: ["analyzeGap"],
    guard: (state) =>
      Boolean(state.gapAnalysis) && Boolean(state.resumeSkills),
  })
  .compile();

// ── Convenience Runner ────────────────────────────────────────────────────────

export async function runCareerPipeline(
  inputs: Omit<PipelineState, "errors" | "completedNodes" | "currentNode">,
  onNodeComplete?: (nodeName: string, state: PipelineState) => void
): Promise<PipelineState> {
  return careerPipeline.invoke(inputs, { onNodeComplete });
}

// ── Re-exports ────────────────────────────────────────────────────────────────

export { PipelineGraphBuilder, CompiledPipelineGraph };

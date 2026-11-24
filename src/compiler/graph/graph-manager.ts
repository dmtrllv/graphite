import { Allocator } from "../../utils/allocator";
import { GraphError, GraphErrorType } from "./error";
import { Graph, type GraphNodeType, type GraphType } from "./graph";
import { isSubGraphNode } from "./nodes";
import type { SubGraph } from "./subgraph";
import { WorldGraph } from "./world";

export class GraphManager {
	private readonly graphs: Allocator<Graph>;

	public readonly worldGraph!: WorldGraph;

	public getGraphs<T extends Graph>(type: GraphType<T, any>): T[] {
		return this.graphs.all().filter(graph => graph instanceof type) as T[];
	}

	public constructor() {
		this.graphs = new Allocator(Graph);
		this.worldGraph = this.graphs.allocWithId(WorldGraph, "World", this);
		this.worldGraph.init();
	}

	public createGraph<T extends SubGraph, Args extends any[]>(type: GraphType<T, Args>, name: string, ...args: Args): T {
		const graph = this.graphs.allocWithId(type, name, this, ...args);
		graph.init();
		return graph;
	}

	public validateNode<T extends Graph>(graph: T, node: GraphNodeType<T>) {
		if (!this.graphs.includes(graph))
			throw new GraphError(graph, GraphErrorType.InvalidGraph);

		if (!isSubGraphNode(node))
			return;

		if (!this.graphs.includes(node.graph))
			throw new GraphError(graph, GraphErrorType.InvalidGraph);

		if (node.graph === graph || this.hasDependency(node.graph, graph))
			throw new GraphError(graph, GraphErrorType.InvalidNode, node);
	}

	private hasDependency(graph: Graph, target: Graph, visited = new Set<Graph>()): boolean {
		if (graph === target)
			return true;

		if (visited.has(graph))
			return false;

		visited.add(graph);

		for (const node of graph.nodes) {
			if (!isSubGraphNode(node))
				continue;

			if (this.hasDependency(node.graph, target, visited))
				return true;
		}

		return false;
	}
}
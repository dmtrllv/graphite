import { Allocator, assert, Result } from "@utils";
import { Edge, Graph, type GraphNodeType, type GraphType, type SerializedGraph } from "./graph";
import { WorldGraph } from "./world";
import { getGraphType } from "./graphs";
import { SubGraph } from "./subgraph";
import { isNodeType, isSubGraphNode, SubGraphNode, type Node, type NodeInputName, type NodeOutputName, type NodeProps, type NodeType } from "./nodes";
import type { GraphError } from "./error";

export class GraphManager {
	private readonly graphs: Allocator<Graph>;

	public get worldGraph(): WorldGraph {
		return this.getGraph(0) as WorldGraph;
	}

	public constructor(graphs?: SerializedGraphs) {
		this.graphs = new Allocator(Graph);
		if (graphs?.length)
			graphs.forEach(g => this.graphs.allocAt(g.id, getGraphType(g.type), g.id, g.name, g.nodes, g.edges));
		else
			this.graphs.allocWithId(WorldGraph, "World");
	}

	public serialize(): SerializedGraphs {
		return this.graphs.all().map(g => g.serialize());
	}

	public getGraph(id: number): Graph {
		return assert.notNull(this.graphs.get(id));
	}

	public getGraphs<T extends Graph>(type: GraphType<T>): T[] {
		return this.graphs.all().filter(graph => graph instanceof type) as T[];
	}

	public createGraph<T extends SubGraph>(type: GraphType<T>, name: string): T {
		return this.graphs.allocWithId(type, name);
	}

	public addNode<T extends Graph, U extends GraphNodeType<T>, P extends NodeProps<U>>(idOrGraph: number | T, type: NodeType<U, P>, props: P): U {
		const graph = typeof idOrGraph === "number" ? this.getGraph(idOrGraph) : idOrGraph;

		if (isNodeType(type, SubGraphNode)) {
			const subGraph = this.getGraph((props as any).graph);
			assert(() => subGraph !== graph && !this.hasDependency(subGraph, graph), "Recursive subgraphs are not allowed!");
		}

		return graph.addNode(type, props);
	}

	public tryAddNode<T extends Node<P>, P extends {}>(idOrGraph: number | Graph, type: NodeType<T, P>, props: P): Result<T, GraphError> {
		const graph = typeof idOrGraph === "number" ? this.getGraph(idOrGraph) : idOrGraph;

		if (isNodeType(type, SubGraphNode)) {
			const subGraph = this.getGraph((props as any).graph);
			assert(() => subGraph !== graph && !this.hasDependency(subGraph, graph), "Recursive subgraphs are not allowed!");
		}

		return graph.tryAddNode(type, props);
	}

	private hasDependency(graph: Graph, target: Graph, visited = new Set<number>()): boolean {
		if (graph === target)
			return true;

		if (visited.has(graph.id))
			return false;

		visited.add(graph.id);

		for (const node of graph.nodes) {
			if (isSubGraphNode(node) && this.hasDependency(this.getGraph(node.props.graph), target, visited))
				return true;
		}

		return false;
	}
}

export type MatchingNodeInputPortNames<Source extends Node, Target extends Node, OutputKey extends NodeOutputName<Target>> = {
	[K in NodeInputName<Source>]: ReturnType<Target["getOutputs"]>[OutputKey] extends ReturnType<Source["getInputs"]>[K] ? K : never;
}[NodeInputName<Source>];

export type SerializedGraphs = SerializedGraph[];

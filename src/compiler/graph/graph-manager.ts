import { Allocator, assert } from "@utils";
import { Edge, Graph, type GraphNodeType, type GraphType, type SerializedGraph } from "./graph";
import { WorldGraph } from "./world";
import { getGraphType } from "./graphs";
import type { SubGraph } from "./subgraph";
import type { Node, NodeInputName, NodeOutputName, NodeProps, NodeType } from "./nodes";

export class GraphManager {
	private readonly graphs: Allocator<Graph>;

	public readonly worldGraph!: WorldGraph;

	public constructor(graphs?: SerializedGraphs) {
		this.graphs = new Allocator(Graph);
		if (graphs)
			graphs.forEach(g => this.graphs.allocAt(g.id, getGraphType(g.type), g.id, g.name, g.nodes, g.edges));
	}

	public serialize(): SerializedGraphs {
		return this.graphs.all().map(g => g.serialize());
	}

	public getGraph(id: number) {
		return assert.notNull(this.graphs.get(id));
	}

	public createGraph<T extends SubGraph>(type: GraphType<T>, name: string) {
		return this.graphs.allocWithId(type, name);
	}

	public addNode<T extends Graph, U extends GraphNodeType<T>, P extends NodeProps<U>>(idOrGraph: number | T, type: NodeType<U, P>, props: P): U {
		const graph = typeof idOrGraph === "number" ? this.getGraph(idOrGraph) : idOrGraph;
		return graph.nodes.allocWithId(type, graph.id, props);
	}

	public connect<T extends Graph, Source extends GraphNodeType<T>, K extends NodeOutputName<InstanceType<Source>>, Target extends GraphNodeType<T>>(graph: number | T, source: Source, outputPort: K, target: Target, inputPort: MatchingNodeInputPortNames<Target, Source, K>): Edge {
		graph = typeof graph === "number" ? this.getGraph(graph) as T : graph;
		assert(() => source.graphId === graph.id, ``);
		assert(() => target.graphId === graph.id, ``);

		return graph.edges.allocWithId(Edge, {
			source: source.id,
			outputPort: outputPort.toString(),
			target: target.id,
			inputPort: inputPort.toString(),
		});
	}
}

export type MatchingNodeInputPortNames<Source extends Node, Target extends Node, OutputKey extends NodeOutputName<Target>> = {
	[K in NodeInputName<Source>]: ReturnType<Target["getOutputs"]>[OutputKey] extends ReturnType<Source["getInputs"]>[K] ? K : never;
}[NodeInputName<Source>];

export type SerializedGraphs = SerializedGraph[];

export type SerializedData<T> = T extends { serialize(): infer R } ? R : never;
import { Allocator, assert } from "../utils";
import { Graph, type GraphInputKey, type GraphIOTypes, type GraphState, type GraphType } from "./graph";
import { Node, type InferNodeState, type NodeType } from "./node";
import { GraphInputNode, GraphOutputNode } from "./nodes/graph";
import { World } from "./world";

export class GraphManager {
	private readonly graphs = new Allocator(Graph);
	private readonly nodes = new Map<Graph, Allocator<Node>>();

	public readonly worldGraph: World;

	public constructor() {
		this.worldGraph = this.addGraph(World, { name: "World" });
	}

	public addGraph<T extends Graph<I, O, S>, I extends GraphIOTypes, O extends GraphIOTypes, S extends {} = any>(type: GraphType<T, I, O, S>, state: GraphState<S>): T {
		const graph = this.graphs.allocWithId(type, this, state);
		const nodes = new Allocator(Node);
		this.nodes.set(graph, nodes);
		nodes.allocWithId(GraphOutputNode, this, graph, { graph });
		return graph;
	}

	public getGraphOutputNode<T extends Graph>(graph: T): GraphOutputNode<T> {
		return assert.notNull(this.nodes.get(graph)).get(0) as GraphOutputNode<T>;
	}

	public addNode<T extends NodeType<any>, S extends {}>(graph: Graph, type: T, state: S): InstanceType<T> {
		const nodes = assert.notNull(this.nodes.get(graph));
		return nodes.allocWithId(type as any, this, graph, state);
	}

	//public addInputNode<T extends Graph, K extends GraphInputKey<T>>(graph: T, key: K): GraphInputNode<T, K> {
	//	return this.addNode<GraphInputNode<T, K>>(graph, GraphInputNode, { graph, key });
	//}

}

type InferNodeTypeState<T> = T extends new (id: number, manager: GraphManager, graph: Graph, state: infer S) => Node<any> ? S : false;
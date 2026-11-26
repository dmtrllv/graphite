import { WorldGraph, type WorldGraphProps } from "../graphite copy/world";
import { Allocator, assert } from "../utils";
import { Edge } from "./edge";
import { Graph, type GraphIOTypes, type GraphState, type GraphType } from "./graph";
import { Node, type InferNodeState, type NodeType } from "./node";
import { GraphOutputNode } from "./nodes/graph";
import type { OutputPort, InputPort } from "./port";
import type { SubGraph } from "./subgraph";
import type { Type } from "./types";
import { World } from "./world";

export class GraphManager {
	private readonly graphs = new Allocator(Graph);
	private readonly nodes = new Map<Graph, Allocator<Node>>();
	private readonly edges = new Map<Graph, Allocator<Edge>>();

	public readonly worldGraph: World;

	public constructor() {
		this.worldGraph = this.allocGraph(World, { name: "World" });
	}

	private allocGraph<T extends SubGraph<I, O, S>, I extends GraphIOTypes, O extends GraphIOTypes, S extends {} = any>(type: GraphType<T, I, O, S>, state: GraphState<S>): T {
		const graph = this.graphs.alloc(type, this, state);
		const nodes = new Allocator(Node);
		this.nodes.set(graph, nodes);
		this.edges.set(graph, new Allocator(Edge));
		nodes.alloc(GraphOutputNode, this, graph, { graph });
		return graph;
	}

	public addGraph<T extends SubGraph<I, O, S>, I extends GraphIOTypes, O extends GraphIOTypes, S extends {} = any>(type: Exclude<GraphType<T, I, O, S>, WorldGraph>, state: GraphState<S>): T {
		assert(WorldGraph !== type as any);
		return this.allocGraph(type, state);
	}

	public getGraphOutputNode<T extends Graph>(graph: T): GraphOutputNode<T> {
		return assert.notNull(this.nodes.get(graph)).get(0) as GraphOutputNode<T>;
	}

	public addNode<T extends Node<S>, S extends {}>(graph: Graph, type: NodeType<T, any>, state: S): T {
		const nodes = assert.notNull(this.nodes.get(graph));
		return nodes.alloc(type as any, this, graph, state);
	}

	public connect<T extends Type>(outputPort: OutputPort<any, any, T>, inputPort: InputPort<any, any, T>) {
		console.log(`connect ${outputPort} -> ${inputPort}`);
	}

	//public addInputNode<T extends Graph, K extends GraphInputKey<T>>(graph: T, key: K): GraphInputNode<T, K> {
	//	return this.addNode<GraphInputNode<T, K>>(graph, GraphInputNode, { graph, key });
	//}

}

type InferNodeTypeState<T> = T extends new (id: number, manager: GraphManager, graph: Graph, state: infer S) => Node<any> ? S : false;
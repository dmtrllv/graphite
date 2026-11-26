import { WorldGraph } from "../graphite copy/world";
import { Allocator, assert } from "../utils";
import { Edge } from "./edge";
import { Graph, type GraphIOTypes, type GraphState, type GraphType } from "./graph";
import { Node, type NodeType } from "./node";
import { GraphNode, GraphOutputNode } from "./nodes/graph";
import type { OutputPort, InputPort } from "./port";
import { SubGraph } from "./subgraph";
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

	public removeNode(node: Node) {
		console.log(`remove node ${node.type}`);

		const nodes = assert.notNull(this.nodes.get(node.graph));
		for (const input in node.inputs) {
			const edge = node.inputs[input]?.edge;
			if (edge)
				this.disconnect(edge);
		}
		for (const output in node.outputs) {
			node.outputs[output]!.edges.forEach(this.disconnect);
		}
		return nodes.free(node.id);
	}

	public connect<T extends Type>(outputPort: OutputPort<any, any, T>, inputPort: InputPort<any, any, T>): Edge<T> {
		console.log(`connect ${outputPort} -> ${inputPort}`);
		const edges = assert.notNull(this.edges.get(outputPort.node.graph));
		return edges.alloc(Edge, this, outputPort, inputPort) as Edge<T>;
	}

	public disconnect(edge: Edge) {
		console.log(`disconnect ${edge.source} -> ${edge.target}`);
		const edges = assert.notNull(this.edges.get(edge.source.node.graph));
		edges.free(edge.id);
	}

	public getNodeInputEdge<T extends Node<{}>, K extends keyof T["inputTypes"]>(node: T, key: K): Edge<T["inputTypes"][K]> | null {
		return this.edges.get(node.graph)?.all().find(e => e.target.node.id === node.id && key === e.target.key) as Edge<T["inputTypes"][K]> || null;
	}

	public getNodeOutputEdges<T extends Node<{}>, K extends keyof T["outputTypes"]>(node: T, key: K): Edge<T["outputTypes"][K]>[] {
		return this.edges.get(node.graph)?.all().filter(e => e.target.node.id === node.id && key === e.target.key) as Edge<T["outputTypes"][K]>[] || [];
	}

	public removeGraph(graph: Graph) {
		console.log(`remove graph ${graph.state.name}`);

		this.nodes.values().forEach(nodes => {
			nodes.all().forEach(n => {
				if (n instanceof GraphNode && n.state.graph === graph)
					this.removeNode(n);
			});
		});

		this.edges.delete(graph);
		this.nodes.delete(graph);
		this.graphs.free(graph.id);
	}
}
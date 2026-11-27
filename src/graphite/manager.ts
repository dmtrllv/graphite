import { WorldGraph } from "../graphite copy/world";
import { Allocator, assert } from "../utils";
import { Edge } from "./edge";
import { Graph, type GraphIOTypes, type GraphState, type GraphType, type SerializedGraph } from "./graph";
import { parseGraphType } from "./graph-types";
import { Node, type NodePosition, type NodeType } from "./node";
import { GraphNode, GraphOutputNode } from "./nodes/graph";
import { InputPort, OutputPort } from "./port";
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
		nodes.alloc(GraphOutputNode, this, graph, { graph }, [0, 0] as NodePosition);
		return graph;
	}

	public addGraph<T extends SubGraph<I, O, S>, I extends GraphIOTypes, O extends GraphIOTypes, S extends {} = any>(type: Exclude<GraphType<T, I, O, S>, WorldGraph>, state: GraphState<S>): T {
		assert(WorldGraph !== type as any);
		return this.allocGraph(type, state);
	}

	public getGraphOutputNode<T extends Graph>(graph: T): GraphOutputNode<T> {
		return assert.notNull(this.nodes.get(graph)?.get(0)) as any;
	}

	public addNode<T extends Node<S>, S extends {}>(graph: Graph, type: NodeType<T, any>, state: S, position?: NodePosition): T {
		const nodes = assert.notNull(this.nodes.get(graph));
		return nodes.alloc(type as any, this, graph, state, position);
	}

	public removeNode(node: Node): boolean {
		const nodes = assert.notNull(this.nodes.get(node.graph));
		const edges = assert.notNull(this.edges.get(node.graph));
		
		node.dispose();

		for (const edge of edges.all().slice()) {
			if (edge.source.node === node || edge.target.node === node)
				this.disconnect(edge);
		}

		return nodes.free(node.id);
	}

	public connect<T extends Type>(outputPort: OutputPort<any, any, T>, inputPort: InputPort<any, any, T>): Edge<T> {
		const edges = assert.notNull(this.edges.get(outputPort.node.graph));
		return edges.alloc(Edge, this, outputPort, inputPort) as Edge<T>;
	}

	public disconnect(edge: Edge) {
		const edges = assert.notNull(this.edges.get(edge.source.node.graph));
		edges.free(edge.id);
	}

	public getNodeInputEdge<T extends Node<{}>, K extends keyof T["inputTypes"]>(node: T, key: K): Edge<T["inputTypes"][K]> | null {
		return this.edges.get(node.graph)?.all().find(e => e.target.node.id === node.id && key === e.target.key) as Edge<T["inputTypes"][K]> || null;
	}

	public getNodeOutputEdges<T extends Node<{}>, K extends keyof T["outputTypes"]>(node: T, key: K): Edge<T["outputTypes"][K]>[] {
		return this.edges.get(node.graph)?.all().filter(e => e.source.node.id === node.id && key === e.source.key) as Edge<T["outputTypes"][K]>[] || [];
	}

	public removeGraph(graph: Graph) {
		graph.dispose();

		for (const nodes of this.nodes.values()) {
			for (const node of nodes.all().slice()) {
				if (node instanceof GraphNode && node.state.graph === graph)
					this.removeNode(node);
			}
		}

		for (const edge of this.edges.get(graph)?.all() ?? [])
			this.disconnect(edge);

		this.edges.delete(graph);
		this.nodes.delete(graph);
		
		this.graphs.free(graph.id);
	}

	public getNodes(graph: Graph) {
		return this.nodes.get(graph)?.all() ?? [];
	}

	public getEdges(graph: Graph) {
		return this.edges.get(graph)?.all() ?? [];
	}

	public getGraphs() {
		return this.graphs.all();
	}

	public getGraph(graph: number): Graph {
		return assert.notNull(this.graphs.get(graph));
	}

	public deserializeGraphs(all: SerializedGraph[]): void {
		const [_, ...graphs] = all;
		graphs.forEach(graph => {
			const GraphType = parseGraphType(graph.type);
			const g = this.graphs.allocAt(graph.id, GraphType, this, GraphType.deserialize(graph.state));
			this.nodes.set(g, new Allocator(Node));
			this.edges.set(g, new Allocator(Edge));
		});
		all.forEach((serializedGraph) => {
			const graph = assert.notNull(this.graphs.get(serializedGraph.id));
			const nodes = assert.notNull(this.nodes.get(graph));
			serializedGraph.nodes.forEach(({ id, type, state, position }) => {
				const NodeType = assert.notNull(Node.resolveType(type), `Could not resolve node type ${type}!`);
				const deserialized = Node.deserialize(NodeType, this, state);
				nodes.allocAt(id, NodeType, this, graph, deserialized, position);
			});
			const edges = assert.notNull(this.edges.get(graph));
			serializedGraph.edges.forEach(({ source, output, target, input }) => {
				const sourceNode = assert.notNull(nodes.get(source), `Missing source node with id ${source}!`);
				const targetNode = assert.notNull(nodes.get(target), `Missing target node with id ${target}!`);
				edges.alloc(Edge, this, new OutputPort(this, sourceNode, output), new InputPort(this, targetNode, input));
			});
		});
	}
}
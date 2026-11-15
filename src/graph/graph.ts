import { observable } from "../reactive";
import type { GraphNode, GraphNodeType } from "./nodes";
import { Vec2 } from "./types";

export class Graph {
	#nodeIdCounter = 0;
	#edgeIdCounter = 0;

	public readonly id: number;

	@observable
	public accessor name: string;

	@observable
	public accessor offset: Vec2;

	@observable
	public accessor scale: number = 1;

	@observable
	public accessor nodes: Map<number, GraphNode>;

	@observable
	public accessor edges: Map<number, NodeEdge>;

	public constructor(id: number, name: string, offset: Vec2);
	public constructor(id: number, name: string, offset: Vec2, nodes?: Map<number, GraphNode>, edges?: Map<number, NodeEdge>);
	public constructor(id: number, name: string, offset: Vec2, nodes: Map<number, GraphNode> = new Map(), edges: Map<number, NodeEdge> = new Map()) {
		this.id = id;
		this.name = name;
		this.offset = offset;
		this.nodes = nodes;
		this.edges = edges;
	}

	public addNode<T extends GraphNode>(type: GraphNodeType<T>, position: Vec2 = new Vec2()): T {
		const id = this.#nodeIdCounter++;
		const node = new type(id, this, position);
		this.nodes.set(id, node);
		return node;
	}

	public removeNode(id: number): void;
	public removeNode(node: GraphNode): void;
	public removeNode(idOrNode: number | GraphNode) {
		if (typeof idOrNode === "number")
			this.nodes.delete(idOrNode);
		const found = this.nodes.entries().find(([_, edge]) => idOrNode === edge);
		if (found)
			this.nodes.delete(found[0]);
	}

	public addEdge<O2 extends GraphNode, I extends GraphNode>(source: O2, sourceOutput: keyof O2, target: I, targetInput: keyof I): NodeEdge {
		const id = this.#edgeIdCounter++;
		const edge = new NodeEdge(id, source, sourceOutput as any, target, targetInput as any);
		this.edges.set(id, edge);
		return edge;
	}

	public removeEdge(id: number): void;
	public removeEdge(edge: NodeEdge): void;
	public removeEdge(idOrEdge: number | NodeEdge) {
		if (typeof idOrEdge === "number")
			this.edges.delete(idOrEdge);
		const found = this.edges.entries().find(([_, edge]) => idOrEdge === edge);
		if (found)
			this.edges.delete(found[0]);
	}
}

export class NodeEdge {
	public readonly id: number;

	@observable
	public accessor source: GraphNode;

	@observable
	public accessor sourceOutput: string;

	@observable
	public accessor target: GraphNode;

	@observable
	public accessor targetInput: string;

	public constructor(id: number, source: GraphNode, sourceOutput: keyof typeof source, target: GraphNode, targetInput: keyof typeof target) {
		this.id = id;
		this.source = source;
		this.sourceOutput = sourceOutput;
		this.target = target;
		this.targetInput = targetInput;
	}
}
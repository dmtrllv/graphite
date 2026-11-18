import { observable } from "../reactive";
import { GraphNode, type GraphNodeJson, type GraphNodeType } from "./nodes";
import { Vec2 } from "./types";
import { GraphIndex, type GraphIndexJson } from "./graph-index";

const RECONCILING_GRAPHS = new WeakSet<Graph>();

export class Graph {
	private _nodeIdCounter = 0;
	private _edgeIdCounter = 0;

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

	@observable
	public accessor structureVersion = 0;

	public readonly index = new GraphIndex();

	public constructor(id: number, name: string, offset: Vec2);
	public constructor(id: number, name: string, offset: Vec2, nodes?: Map<number, GraphNode>, edges?: Map<number, NodeEdge>);
	public constructor(id: number, name: string, offset: Vec2, nodes: Map<number, GraphNode> = new Map(), edges: Map<number, NodeEdge> = new Map()) {
		this.id = id;
		this.name = name;
		this.offset = offset;
		this.nodes = nodes;
		this.edges = edges;

		for (const node of this.nodes.values())
			this._nodeIdCounter = Math.max(this._nodeIdCounter, node.id + 1);

		for (const edge of this.edges.values()) {
			this.index.add(edge);
			this._edgeIdCounter = Math.max(this._edgeIdCounter, edge.id + 1);
		}
	}

	public getEdge(source: GraphNode, sourceOutput: string, target: GraphNode, targetInput: string): NodeEdge | undefined {
		return this.index.getOutputEdges(source, sourceOutput).find(edge => edge.target === target && edge.targetInput === targetInput);
	}

	public addNode<T extends GraphNode>(type: GraphNodeType<T>, position: Vec2 = new Vec2()): T {
		const node = new type(this._nodeIdCounter++, this, position);
		this.nodes.set(node.id, node);
		this.structureVersion++;
		return node;
	}

	public restoreNode(node: GraphNode): void {
		if (this.nodes.has(node.id))
			return;

		this.nodes.set(node.id, node);
		this._nodeIdCounter = Math.max(this._nodeIdCounter, node.id + 1);
		this.structureVersion++;
	}

	public removeNode(id: number): void;
	public removeNode(node: GraphNode): void;
	public removeNode(idOrNode: number | GraphNode): void {
		const node = typeof idOrNode === "number" ? this.nodes.get(idOrNode) : idOrNode;

		if (!node || !this.nodes.has(node.id))
			return;

		for (const edge of this.index.getConnectedEdges(node))
			this.removeEdge(edge);

		this.nodes.delete(node.id);
		this.structureVersion++;
	}

	public addEdge(source: GraphNode, sourceOutput: string, target: GraphNode, targetInput: string): NodeEdge | null {
		if (source === target)
			return null;

		const sourcePort = GraphNode.getPort(source, sourceOutput, "output");
		const targetPort = GraphNode.getPort(target, targetInput, "input");

		if (!sourcePort || !targetPort || !GraphNode.canConnect(sourcePort, targetPort))
			return null;

		const foundEdge = this.getEdge(source, sourceOutput, target, targetInput);

		if (foundEdge)
			return foundEdge;

		const inputEdge = this.index.getInputEdge(target, targetInput);

		if (inputEdge)
			this.removeEdge(inputEdge);

		const edge = new NodeEdge(this._edgeIdCounter++, source, sourceOutput, target, targetInput);

		this.edges.set(edge.id, edge);
		this.index.add(edge);
		this.structureVersion++;

		return edge;
	}

	public removeEdge(id: number): void;
	public removeEdge(edge: NodeEdge): void;
	public removeEdge(idOrEdge: number | NodeEdge): void {
		const edge = typeof idOrEdge === "number" ? this.edges.get(idOrEdge) : idOrEdge;

		if (!edge || !this.edges.has(edge.id))
			return;

		this.edges.delete(edge.id);
		this.index.remove(edge);
		this.structureVersion++;
	}

	public restoreEdge(edge: NodeEdge): void {
		if (this.edges.has(edge.id))
			return;

		const inputEdge = this.index.getInputEdge(edge.target, edge.targetInput);

		if (inputEdge)
			this.removeEdge(inputEdge);

		this.edges.set(edge.id, edge);
		this.index.add(edge);
		this._edgeIdCounter = Math.max(this._edgeIdCounter, edge.id + 1);
		this.structureVersion++;
	}

	public getCanvasMousePosition(position: Vec2, canvas: HTMLCanvasElement): Vec2 {
		const rect = canvas.getBoundingClientRect();

		return new Vec2(
			(position.x - rect.left - rect.width / 2 - this.offset.x) / this.scale,
			(rect.height / 2 - (position.y - rect.top) - this.offset.y) / this.scale
		);
	}

	public reconcileEdges(): void {
		if (RECONCILING_GRAPHS.has(this))
			return;

		RECONCILING_GRAPHS.add(this);

		try {
			for (const edge of [...this.edges.values()]) {
				const source = GraphNode.getPort(edge.source, edge.sourceOutput, "output");
				const target = GraphNode.getPort(edge.target, edge.targetInput, "input");

				if (!source || !target || !GraphNode.canConnect(source, target))
					this.removeEdge(edge);
			}
		} finally {
			RECONCILING_GRAPHS.delete(this);
		}
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

	public constructor(id: number, source: GraphNode, sourceOutput: string, target: GraphNode, targetInput: string) {
		this.id = id;
		this.source = source;
		this.sourceOutput = sourceOutput;
		this.target = target;
		this.targetInput = targetInput;
	}
}
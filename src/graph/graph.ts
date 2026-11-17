import { observable } from "../reactive";
import { GraphNode, type GraphNodeType } from "./nodes";
import { Vec2 } from "./types";

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
	public accessor draggingEdge: DraggingEdge<any> | null = null;


	@observable
	public accessor selection: Selection | null = null;

	@observable
	public accessor selectedNodes: GraphNode[] = [];

	public constructor(id: number, name: string, offset: Vec2);
	public constructor(id: number, name: string, offset: Vec2, nodes?: Map<number, GraphNode>, edges?: Map<number, NodeEdge>);
	public constructor(id: number, name: string, offset: Vec2, nodes: Map<number, GraphNode> = new Map(), edges: Map<number, NodeEdge> = new Map()) {
		this.id = id;
		this.name = name;
		this.offset = offset;
		this.nodes = nodes;
		this.edges = edges;
	}

	public getEdge<Output extends GraphNode, Input extends GraphNode>(source: Output, sourceOutput: keyof Output, target: Input, targetInput: keyof Input): NodeEdge | undefined {
		return this.edges.values().find(v => {
			if (v.source !== source)
				return false;
			if (v.sourceOutput !== sourceOutput)
				return false;
			if (v.target !== target)
				return false;
			if (v.targetInput !== targetInput)
				return false;
			return true;
		});
	}

	public addNode<T extends GraphNode>(type: GraphNodeType<T>, position: Vec2 = new Vec2()): T {
		const id = this._nodeIdCounter++;
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

	public addEdge<Output extends GraphNode, Input extends GraphNode>(source: Output, sourceOutput: keyof Output, target: Input, targetInput: keyof Input): NodeEdge | null {
		if (source === target as GraphNode)
			return null;

		if (!GraphNode.hasOutput(source, sourceOutput.toString()))
			return null;
		if (!GraphNode.hasInput(target, targetInput.toString()))
			return null;

		const foundEdge = this.getEdge(source, sourceOutput, target, targetInput);
		if (foundEdge)
			return foundEdge;

		const id = this._edgeIdCounter++;
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

	public connectDraggingEdge<T extends GraphNode>(node: T, name: keyof T) {
		if (!this.draggingEdge)
			return;

		const edge = this.draggingEdge;

		if (edge.from === "output") {
			this.addEdge(edge.node, edge.key, node, name);
		} else {
			this.addEdge(node, name, edge.node, edge.key);
		}
	}

	public getCanvasMousePosition = (position: Vec2, canvas: HTMLCanvasElement) => {
		const c = canvas.getBoundingClientRect();

		return new Vec2(
			(position.x - c.x - c.width / 2 - this.offset.x) / this.scale,
			(c.height / 2 - (position.y - c.y) - this.offset.y) / this.scale,
		);
	};

	public isSelected(node: GraphNode): boolean {
		return this.selectedNodes.includes(node);
	}

	public updateSelection(pos: Vec2, canvas: HTMLCanvasElement) {
		if (!this.selection)
			return;

		const d = this.getCanvasMousePosition(this.selection.downPos, canvas);
		const m = this.getCanvasMousePosition(pos, canvas);

		const left = Math.min(d.x, m.x);
		const right = Math.max(d.x, m.x);
		const bottom = Math.min(d.y, m.y);
		const top = Math.max(d.y, m.y);

		const selected: GraphNode[] = [];

		this.nodes.values().forEach(node => {
			if (node.position.x < left || node.position.x > right)
				return;

			if (node.position.y < bottom || node.position.y > top)
				return;

			selected.push(node);
		});

		this.selectedNodes = selected;
		this.selection.mousePos = pos;
	}
}

export type DraggingEdge<T extends GraphNode> = {
	readonly from: "input" | "output";
	readonly node: T;
	readonly key: keyof T;
	readonly mousePosition: Vec2;
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

export class Selection {
	@observable
	public accessor downPos: Vec2;

	@observable
	public accessor mousePos: Vec2;

	public constructor(downPos: Vec2, mousePos: Vec2) {
		this.downPos = downPos;
		this.mousePos = mousePos;
	}
}
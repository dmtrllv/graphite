import { observable } from "../reactive";
import { GraphNode, type GraphNodeType } from "./nodes";
import { Vec2 } from "./types";
import { GraphIndex } from "./graph-index";

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

	@observable
	public accessor slice: Slice | null = null;

	public readonly index = new GraphIndex();

	public constructor(id: number, name: string, offset: Vec2);
	public constructor(id: number, name: string, offset: Vec2, nodes?: Map<number, GraphNode>, edges?: Map<number, NodeEdge>);
	public constructor(id: number, name: string, offset: Vec2, nodes: Map<number, GraphNode> = new Map(), edges: Map<number, NodeEdge> = new Map()) {
		this.id = id;
		this.name = name;
		this.offset = offset;
		this.nodes = nodes;
		this.edges = edges;

		for (const edge of this.edges.values())
			this.index.add(edge);
	}

	public getEdge<Output extends GraphNode, Input extends GraphNode>(source: Output, sourceOutput: (keyof Output) & string, target: Input, targetInput: (keyof Input) & string): NodeEdge | undefined {
		return this.index.getOutputEdges(source, sourceOutput).find(edge =>
			edge.target === target && edge.targetInput === targetInput
		);
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
		const node = typeof idOrNode === "number" ? this.nodes.get(idOrNode) : idOrNode;

		if (!node)
			return;

		for (const edge of [...this.edges.values()]) {
			if (edge.source === node || edge.target === node)
				this.removeEdge(edge);
		}

		this.nodes.delete(node.id);
	}

	public addEdge<Output extends GraphNode, Input extends GraphNode>(source: Output, sourceOutput: (keyof Output) & string, target: Input, targetInput: (keyof Input) & string): NodeEdge | null {
		if (source === target as GraphNode)
			return null;

		if (!GraphNode.hasOutput(source, sourceOutput.toString()))
			return null;

		if (!GraphNode.hasInput(target, targetInput.toString()))
			return null;

		const foundEdge = this.getEdge(source, sourceOutput, target, targetInput);

		if (foundEdge)
			return foundEdge;

		const inputEdge = this.index.getInputEdge(target, targetInput);

		if (inputEdge)
			this.removeEdge(inputEdge);

		const id = this._edgeIdCounter++;
		const edge = new NodeEdge(id, source, sourceOutput as any, target, targetInput as any);

		this.edges.set(id, edge);
		this.index.add(edge);

		return edge;
	}

	public removeEdge(id: number): void;
	public removeEdge(edge: NodeEdge): void;
	public removeEdge(idOrEdge: number | NodeEdge) {
		const edge = typeof idOrEdge === "number" ? this.edges.get(idOrEdge) : idOrEdge;

		if (!edge)
			return;

		this.edges.delete(edge.id);
		this.index.remove(edge);
	}

	public connectDraggingEdge<T extends GraphNode>(node: T, name: keyof T & string) {
		if (!this.draggingEdge)
			return;

		const edge = this.draggingEdge;

		if (edge.from === "output") {
			this.addEdge(edge.node, edge.key.toString(), node, name);
		} else {
			this.addEdge(node, name, edge.node, edge.key.toString());
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

	public cutEdges() {
		if (!this.slice)
			return;

		const { downPos, mousePos } = this.slice;

		const minX = Math.min(downPos.x, mousePos.x);
		const maxX = Math.max(downPos.x, mousePos.x);
		const minY = Math.min(downPos.y, mousePos.y);
		const maxY = Math.max(downPos.y, mousePos.y);

		const intersects = (a: Vec2, b: Vec2, c: Vec2, d: Vec2): boolean => {
			const cross = (p: Vec2, q: Vec2, r: Vec2) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);

			const abC = cross(a, b, c);
			const abD = cross(a, b, d);
			const cdA = cross(c, d, a);
			const cdB = cross(c, d, b);

			return abC * abD <= 0 && cdA * cdB <= 0;
		};

		const sliceStart = new Vec2(minX, minY);
		const sliceEnd = new Vec2(maxX, maxY);

		for (const [id, edge] of this.edges) {
			const source = edge.source.outputElements[edge.sourceOutput];
			const target = edge.target.inputElements[edge.targetInput];

			if (!source || !target)
				continue;

			const sourceRect = source.getBoundingClientRect();
			const targetRect = target.getBoundingClientRect();

			const start = new Vec2(sourceRect.right, sourceRect.top + sourceRect.height / 2);

			const end = new Vec2(targetRect.left, targetRect.top + targetRect.height / 2);

			if (intersects(sliceStart, sliceEnd, start, end))
				this.removeEdge(id);
		}

		this.slice = null;
	}
}

export class DraggingEdge<T extends GraphNode> {
	@observable
	public accessor from: "input" | "output";
	@observable
	public accessor node: T;
	@observable
	public accessor key: keyof T;
	@observable
	public accessor mousePosition: Vec2;

	public constructor(from: "input" | "output", node: T, key: keyof T, mousePosition: Vec2) {
		this.from = from;
		this.node = node;
		this.key = key;
		this.mousePosition = mousePosition;
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

export class Slice {
	@observable
	public accessor downPos: Vec2;

	@observable
	public accessor mousePos: Vec2;

	public constructor(downPos: Vec2, mousePos: Vec2) {
		this.downPos = downPos;
		this.mousePos = mousePos;
	}
}
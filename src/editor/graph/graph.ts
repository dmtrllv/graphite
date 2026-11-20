import { observable } from "@reactive";
import { GraphNode, type GraphNodeType } from "./nodes";
import { Vec2 } from "./types";
import { GraphIndex } from "./graph-index";
import type { GraphManager } from "./graph-manager";
import { F32, Type } from "./types";
import { NodeEdge } from "./edge";
import { Serializable, serializable, arrayOf, mapOf } from "../serializable";

const RECONCILING_GRAPHS = new WeakSet<Graph>();

@observable
@serializable({ type: "graph:port", create: () => new GraphInterfacePort() })
export class GraphInterfacePort extends Serializable {
	@serializable(String)
	public id = "";

	@serializable(String)
	public name = "";

	@serializable(Type)
	public type: Type = new F32(0);
}


@observable
export class Graph extends Serializable {
	private _nodeIdCounter = 0;
	private _edgeIdCounter = 0;

	private _manager?: GraphManager;

	public get manager(): GraphManager | undefined {
		return this._manager;
	}

	@serializable(Number)
	public readonly id: number;

	@observable
	@serializable(String)
	public accessor name: string;

	@observable
	@serializable(Vec2)
	public accessor offset: Vec2;

	@observable
	@serializable(Number)
	public accessor scale: number = 1;

	@observable
	@serializable(mapOf(Number, GraphNode, graph => ({ graph })))
	public accessor nodes: Map<number, GraphNode>;

	@observable
	@serializable(mapOf(Number, NodeEdge))
	public accessor edges: Map<number, NodeEdge>;

	@observable
	@serializable(arrayOf(GraphInterfacePort))
	public accessor inputs: GraphInterfacePort[] = [];

	@observable
	@serializable(arrayOf(GraphInterfacePort))
	public accessor outputs: GraphInterfacePort[] = [];

	@observable
	public accessor structureVersion = 0;

	public readonly index = new GraphIndex();

	protected override initialize(): void {
		this._nodeIdCounter = 0;
		this._edgeIdCounter = 0;

		for (const node of this.nodes.values())
			this._nodeIdCounter = Math.max(this._nodeIdCounter, node.id + 1);

		this.index.clear();

		for (const edge of this.edges.values()) {
			this.index.add(edge);
			this._edgeIdCounter = Math.max(this._edgeIdCounter, edge.id + 1);
		}
	}

	public constructor(id: number, name: string, offset: Vec2, nodes: Map<number, GraphNode> = new Map(), edges: Map<number, NodeEdge> = new Map()) {
		super();
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

	public setManager(manager: GraphManager): void {
		this._manager = manager;
	}

	public getEdge(source: GraphNode, sourceOutput: string, target: GraphNode, targetInput: string): NodeEdge | undefined {
		return this.index.getOutputEdges(source, sourceOutput).find(edge => edge.target === target && edge.targetInput === targetInput);
	}

	public addNode<T extends GraphNode>(type: GraphNodeType<T>, position: Vec2 = new Vec2()): T {
		const node = new type(this._nodeIdCounter++, this, position);
		this.nodes.set(node.id, node);
		this.structureVersion++;
		if ("graphId" in node && node.graphId !== null)
			this._manager?.notifySubgraphTopologyChanged();
		return node;
	}

	public restoreNode(node: GraphNode): void {
		if (this.nodes.has(node.id))
			return;

		this.nodes.set(node.id, node);
		this._nodeIdCounter = Math.max(this._nodeIdCounter, node.id + 1);
		this.structureVersion++;
		if ("graphId" in node && node.graphId !== null)
			this._manager?.notifySubgraphTopologyChanged();
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
		if ("graphId" in node && node.graphId !== null)
			this._manager?.notifySubgraphTopologyChanged();
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

	public addInput(name = "Input", type: Type = new F32(0)): GraphInterfacePort {
		return this.addInterfacePort("input", name, type);
	}

	public addOutput(name = "Output", type: Type = new F32(0)): GraphInterfacePort {
		return this.addInterfacePort("output", name, type);
	}

	public addInterfacePort(direction: "input" | "output", name: string, type: Type = new F32(0)): GraphInterfacePort {
		const ports = direction === "input" ? this.inputs : this.outputs;
		const port = new GraphInterfacePort();
		port.id = crypto.randomUUID();
		port.name = name;
		port.type = type;

		if (ports.some(item => item.name === name))
			throw new Error(`Graph ${direction} "${name}" already exists!`);

		if (direction === "input")
			this.inputs = [...this.inputs, port];
		else
			this.outputs = [...this.outputs, port];

		this.notifyInterfaceChanged();
		return port;
	}

	public updateInterfacePort(direction: "input" | "output", id: string, changes: Partial<Pick<GraphInterfacePort, "name" | "type">>): void {
		const ports = direction === "input" ? this.inputs : this.outputs;
		const port = ports.find(item => item.id === id);

		if (!port)
			return;

		if (changes.name !== undefined && ports.some(item => item.id !== id && item.name === changes.name))
			throw new Error(`Graph ${direction} "${changes.name}" already exists!`);

		const updated = ports.map(item => {
			if (item.id !== id)
				return item;

			const port = new GraphInterfacePort();
			port.id = item.id;
			port.name = changes.name ?? item.name;
			port.type = changes.type ?? item.type;
			return port;
		});

		if (direction === "input")
			this.inputs = updated;
		else
			this.outputs = updated;

		this.notifyInterfaceChanged();
	}

	public removeInterfacePort(direction: "input" | "output", id: string): void {
		const ports = direction === "input" ? this.inputs : this.outputs;

		if (!ports.some(port => port.id === id))
			return;

		if (direction === "input")
			this.inputs = ports.filter(port => port.id !== id);
		else
			this.outputs = ports.filter(port => port.id !== id);

		for (const node of [...this.nodes.values()]) {
			if ("interfaceId" in node && node.interfaceId === id)
				this.removeNode(node);
		}

		this.notifyInterfaceChanged();
	}

	private notifyInterfaceChanged(): void {
		this.structureVersion++;
		this.manager?.notifyInterfaceChanged(this);
	}
}

@observable
@serializable({ type: "graph:world", create: data => new WorldGraph(data.id, data.name, new Vec2()) })
export class WorldGraph extends Graph { }

@observable
@serializable({ type: "graph:subgraph", create: data => new Subgraph(data.id, data.name, new Vec2()) })
export class Subgraph extends Graph { }

@observable
@serializable({ type: "graph:simulation", create: data => new SimulationGraph(data.id, data.name, new Vec2()) })
export class SimulationGraph extends Graph { }
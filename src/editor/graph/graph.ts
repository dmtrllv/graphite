import { observable } from "@reactive";
import { GraphNode, type GraphNodeType } from "./nodes";
import { GraphIndex } from "./graph-index";
import type { GraphManager } from "./graph-manager";
import { F32, Type, Vec2 } from "./types";
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
export abstract class Graph extends Serializable {
	private _nodeIdCounter = 0;
	private _edgeIdCounter = 0;
	private _manager?: GraphManager;

	public get manager(): GraphManager | undefined {
		return this._manager;
	}

	public abstract readonly outputNodeName: string;

	@serializable(Number)
	public readonly id: number;

	@observable
	@serializable(String)
	public accessor name: string;

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
		this.index.clear();

		for (const node of this.nodes.values()) {
			this._nodeIdCounter = Math.max(this._nodeIdCounter, node.id + 1);
		}

		for (const edge of this.edges.values()) {
			this.index.add(edge);
			this._edgeIdCounter = Math.max(this._edgeIdCounter, edge.id + 1);
		}
	}

	public constructor(id: number, name: string, nodes: Map<number, GraphNode> = new Map(), edges: Map<number, NodeEdge> = new Map()) {
		super();
		this.id = id;
		this.name = name;
		this.nodes = nodes;
		this.edges = edges;

		for (const node of nodes.values())
			this._nodeIdCounter = Math.max(this._nodeIdCounter, node.id + 1);

		for (const edge of edges.values()) {
			this.index.add(edge);
			this._edgeIdCounter = Math.max(this._edgeIdCounter, edge.id + 1);
		}
	}

	public setManager(manager: GraphManager): void {
		this._manager = manager;
	}

	public ensureOutputNode(): void {
		const outputs = [...this.nodes.values()].filter(node => node.name === this.outputNodeName);

		if (outputs.length > 1)
			throw new Error(`${this.constructor.name} can only contain one ${this.outputNodeName}!`);

		if (outputs.length === 1)
			return;

		const type = GraphNode.getRegisteredNodes().get(this.outputNodeName);

		if (!type)
			throw new Error(`Node "${this.outputNodeName}" is not registered!`);

		this.addNode(type);
	}

	public validate(): void {
		const outputs = [...this.nodes.values()].filter(node => node.name === this.outputNodeName);

		if (outputs.length !== 1)
			throw new Error(`${this.constructor.name} must contain exactly one ${this.outputNodeName}!`);

		for (const node of this.nodes.values()) {
			if (node.graph !== this)
				throw new Error(`Node ${node.id} does not belong to graph ${this.id}!`);
		}

		const connectedInputs = new Set<string>();

		for (const edge of this.edges.values()) {
			if (edge.source.graph !== this || edge.target.graph !== this)
				throw new Error(`Edge ${edge.id} references a node outside graph ${this.id}!`);

			const source = GraphNode.getPort(edge.source, edge.sourceOutput, "output");
			const target = GraphNode.getPort(edge.target, edge.targetInput, "input");

			if (!source || !target || !GraphNode.canConnect(source, target))
				throw new Error(`Edge ${edge.id} has an invalid connection!`);

			const inputKey = `${edge.target.id}:${edge.targetInput}`;

			if (connectedInputs.has(inputKey))
				throw new Error(`Input ${edge.targetInput} on node ${edge.target.id} has multiple connections!`);

			connectedInputs.add(inputKey);
		}
	}

	public getEdge(source: GraphNode, sourceOutput: string, target: GraphNode, targetInput: string): NodeEdge | undefined {
		return this.index.getOutputEdges(source, sourceOutput).find(edge => edge.target === target && edge.targetInput === targetInput);
	}

	public addNode<T extends GraphNode>(type: GraphNodeType<T>, position: Vec2 = new Vec2()): T {
		if (GraphNode.getRegisteredNodes().get(this.outputNodeName) === type && [...this.nodes.values()].some(node => node.name === this.outputNodeName))
			throw new Error(`${this.constructor.name} already has its mandatory output node!`);

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

		if (node.graph !== this)
			throw new Error(`Cannot restore node ${node.id} into a different graph!`);

		if (node.name === this.outputNodeName && [...this.nodes.values()].some(item => item.name === this.outputNodeName))
			throw new Error(`${this.constructor.name} already has its mandatory output node!`);

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

		if (node.name === this.outputNodeName)
			throw new Error(`${this.outputNodeName} cannot be removed!`);

		for (const edge of this.index.getConnectedEdges(node))
			this.removeEdge(edge);

		this.nodes.delete(node.id);
		this.structureVersion++;

		if ("graphId" in node && node.graphId !== null)
			this._manager?.notifySubgraphTopologyChanged();
	}

	public addEdge(source: GraphNode, sourceOutput: string, target: GraphNode, targetInput: string): NodeEdge | null {
		if (source.graph !== this || target.graph !== this || source === target)
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

		if (edge.source.graph !== this || edge.target.graph !== this)
			throw new Error(`Cannot restore edge ${edge.id} into a different graph!`);

		const source = GraphNode.getPort(edge.source, edge.sourceOutput, "output");
		const target = GraphNode.getPort(edge.target, edge.targetInput, "input");

		if (!source || !target || !GraphNode.canConnect(source, target))
			throw new Error(`Cannot restore invalid edge ${edge.id}!`);

		const inputEdge = this.index.getInputEdge(edge.target, edge.targetInput);

		if (inputEdge)
			this.removeEdge(inputEdge);

		this.edges.set(edge.id, edge);
		this.index.add(edge);
		this._edgeIdCounter = Math.max(this._edgeIdCounter, edge.id + 1);
		this.structureVersion++;
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

		if (ports.some(item => item.name === name))
			throw new Error(`Graph ${direction} "${name}" already exists!`);

		const port = new GraphInterfacePort();
		port.id = crypto.randomUUID();
		port.name = name;
		port.type = type;

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

			const replacement = new GraphInterfacePort();
			replacement.id = item.id;
			replacement.name = changes.name ?? item.name;
			replacement.type = changes.type ?? item.type;
			return replacement;
		});


		if (direction === "input")
			this.inputs = updated;
		else
			this.outputs = updated;


		for (const node of [...this.nodes.values()]) {
			if ("interfaceId" in node && node.interfaceId === id)
				this.removeNode(node);
		}

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

		this.notifyInterfaceChanged();
	}

	protected notifyInterfaceChanged(): void {
		this.structureVersion++;
		this.reconcileEdges();
		this.manager?.notifyInterfaceChanged(this);
	}
}

@observable
@serializable({ type: "graph:world", create: data => new WorldGraph(data.id, data.name) })
export class WorldGraph extends Graph {
	public readonly outputNodeName = "World Output";
}

@observable
@serializable({ type: "graph:subgraph", create: data => new Subgraph(data.id, data.name) })
export class Subgraph extends Graph {
	public readonly outputNodeName = "Graph Output";
}

@observable
@serializable({ type: "graph:pass", create: data => new PassGraph(data.id, data.name) })
export class PassGraph extends Graph {
	public readonly outputNodeName = "Pass Output";

	@observable
	@serializable(mapOf(String, GraphInterfacePort))
	public accessor passOutputs = new Map<string, GraphInterfacePort>();

	public addPassOutput(name = "Output", type: Type = new F32(0)): GraphInterfacePort {
		if ([...this.passOutputs.values()].some(item => item.name === name))
			throw new Error(`Pass output "${name}" already exists!`);

		const definition = new GraphInterfacePort();
		definition.id = crypto.randomUUID();
		definition.name = name;
		definition.type = type;
		this.passOutputs.set(definition.id, definition);
		this.notifyInterfaceChanged();
		return definition;
	}

	public updatePassOutput(id: string, changes: Partial<Pick<GraphInterfacePort, "name" | "type">>): void {
		const definition = this.passOutputs.get(id);

		if (!definition)
			return;

		if (changes.name !== undefined && [...this.passOutputs.values()].some(item => item.id !== id && item.name === changes.name))
			throw new Error(`Pass output "${changes.name}" already exists!`);

		const updated = new GraphInterfacePort();
		updated.id = definition.id;
		updated.name = changes.name ?? definition.name;
		updated.type = changes.type ?? definition.type;
		this.passOutputs.set(id, updated);
		this.notifyInterfaceChanged();
	}

	public removePassOutput(id: string): void {
		if (!this.passOutputs.delete(id))
			return;

		this.notifyInterfaceChanged();
	}
}

@observable
@serializable({ type: "graph:simulation", create: data => new SimulationGraph(data.id, data.name) })
export class SimulationGraph extends Graph {
	public readonly outputNodeName = "Simulation Output";

	@observable
	@serializable(mapOf(String, GraphInterfacePort))
	public accessor states = new Map<string, GraphInterfacePort>();

	public addState(name = "State", type: Type = new F32(0)): GraphInterfacePort {
		if ([...this.states.values()].some(item => item.name === name))
			throw new Error(`Simulation state "${name}" already exists!`);

		const state = new GraphInterfacePort();
		state.id = crypto.randomUUID();
		state.name = name;
		state.type = type;
		this.states.set(state.id, state);
		this.notifyInterfaceChanged();
		return state;
	}

	public updateState(id: string, changes: Partial<Pick<GraphInterfacePort, "name" | "type">>): void {
		const state = this.states.get(id);

		if (!state)
			return;

		if (changes.name !== undefined && [...this.states.values()].some(item => item.id !== id && item.name === changes.name))
			throw new Error(`Simulation state "${changes.name}" already exists!`);

		const updated = new GraphInterfacePort();
		updated.id = state.id;
		updated.name = changes.name ?? state.name;
		updated.type = changes.type ?? state.type;
		this.states.set(id, updated);
		this.notifyInterfaceChanged();
	}

	public removeState(id: string): void {
		if (!this.states.has(id))
			return;

		for (const node of [...this.nodes.values()]) {
			if ("stateId" in node && node.stateId === id)
				this.removeNode(node);
		}

		this.states.delete(id);
		this.notifyInterfaceChanged();
	}

}

import { observable } from "@reactive";
import { GraphNode, GraphOutputNode, PassOutputNode, SimulationOutputNode, WorldOutputNode, type GraphNodeType } from "./nodes";
import { GraphIndex } from "./graph-index";
import type { GraphManager } from "./graph-manager";
import { F32, Type, Vec2 } from "./types";
import { NodeEdge } from "./edge";
import { Serializable, serializable, arrayOf, mapOf } from "../serializable";

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
	private _manager: GraphManager | undefined;

	private _reconcilingEdges = false;

	public get manager(): GraphManager | undefined {
		return this._manager;
	}

	public abstract readonly outputNodeType: GraphNodeType;

	@serializable(Number)
	public accessor outputNodeId: number | null = null;

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


	public isOutputNode(node: GraphNode): boolean {
		return node.graph === this && node.id === this.outputNodeId;
	}


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

	public setManager(manager: GraphManager): void {
		if (this._manager && this._manager !== manager)
			throw new Error(`Graph ${this.id} already belongs to another GraphManager!`);

		this._manager = manager;
	}

	public detachManager(manager: GraphManager): void {
		if (this._manager === manager)
			this._manager = undefined;
	}

	public createOutputNode(): void {
		if (this.outputNodeId !== null)
			throw new Error(`${this.constructor.name} already has an output node!`);

		this.outputNodeId = this.addNode(this.outputNodeType).id;
	}

	private validatePorts = (ports: GraphInterfacePort[], direction: string) => {
		const ids = new Set<string>();
		const names = new Set<string>();

		for (const port of ports) {
			if (!port.id || ids.has(port.id))
				throw new Error(`Graph ${direction} has a duplicate or empty port ID!`);

			if (!port.name.trim() || names.has(port.name))
				throw new Error(`Graph ${direction} has a duplicate or empty port name!`);

			ids.add(port.id);
			names.add(port.name);
		}
	};

	public validate(): void {
		this.validatePorts(this.inputs, "inputs");
		this.validatePorts(this.outputs, "outputs");

		for (const [id, node] of this.nodes) {
			if (id !== node.id)
				throw new Error(`Node map key ${id} does not match node ID ${node.id}!`);

			if (node.graph !== this)
				throw new Error(`Node ${node.id} does not belong to graph ${this.id}!`);
		}

		const outputNodes = [...this.nodes.values()].filter(node => node.constructor === this.outputNodeType);

		if (outputNodes.length !== 1)
			throw new Error(`${this.constructor.name} must contain exactly one output node!`);

		const output = this.outputNodeId === null ? undefined : this.nodes.get(this.outputNodeId);

		if (!output || output.constructor !== this.outputNodeType || output !== outputNodes[0])
			throw new Error(`${this.constructor.name} must reference its valid output node!`);

		const connectedInputs = new Map<GraphNode, Set<string>>();

		for (const [id, edge] of this.edges) {
			if (id !== edge.id)
				throw new Error(`Edge map key ${id} does not match edge ID ${edge.id}!`);

			if (this.nodes.get(edge.source.id) !== edge.source || this.nodes.get(edge.target.id) !== edge.target)
				throw new Error(`Edge ${edge.id} references a node that is not registered in graph ${this.id}!`);

			const source = GraphNode.getPort(edge.source, edge.sourceOutput, "output");
			const target = GraphNode.getPort(edge.target, edge.targetInput, "input");

			if (!source || !target || !GraphNode.canConnect(source, target))
				throw new Error(`Edge ${edge.id} has an invalid connection!`);

			let inputs = connectedInputs.get(edge.target);

			if (!inputs) {
				inputs = new Set();
				connectedInputs.set(edge.target, inputs);
			}

			if (inputs.has(edge.targetInput))
				throw new Error(`Input ${edge.targetInput} on node ${edge.target.id} has multiple connections!`);

			inputs.add(edge.targetInput);

			if (this.index.getInputEdge(edge.target, edge.targetInput) !== edge)
				throw new Error(`GraphIndex has an inconsistent incoming edge ${edge.id}!`);

			if (!this.index.getOutputEdges(edge.source, edge.sourceOutput).includes(edge))
				throw new Error(`GraphIndex has an inconsistent outgoing edge ${edge.id}!`);
		}

		const indexedEdges = this.index.getEdges();

		if (indexedEdges.length !== this.edges.size || indexedEdges.some(edge => this.edges.get(edge.id) !== edge))
			throw new Error(`GraphIndex does not match the edge collection of graph ${this.id}!`);
	}

	public getEdge(source: GraphNode, sourceOutput: string, target: GraphNode, targetInput: string): NodeEdge | undefined {
		return this.index.getOutputEdges(source, sourceOutput).find(edge => edge.target === target && edge.targetInput === targetInput);
	}

	public addNode<T extends GraphNode>(type: GraphNodeType<T>, position: Vec2 = new Vec2()): T {
		if (type === this.outputNodeType && this.outputNodeId !== null)
			throw new Error(`${this.constructor.name} already has its mandatory output node!`);

		const node = new type(this._nodeIdCounter++, this, position);
		this.nodes.set(node.id, node);
		this.structureVersion++;

		if (type === this.outputNodeType)
			this.outputNodeId = node.id;

		if ("graphId" in node && node.graphId !== null)
			this._manager?.notifySubgraphTopologyChanged();

		return node;
	}


	public restoreNode(node: GraphNode): void {
		const existing = this.nodes.get(node.id);

		if (existing === node)
			return;

		if (existing)
			throw new Error(`Node ID ${node.id} is already occupied in graph ${this.id}!`);

		if (node.graph !== this)
			throw new Error(`Cannot restore node ${node.id} into a different graph!`);

		if (node.constructor === this.outputNodeType && this.outputNodeId !== null && this.outputNodeId !== node.id)
			throw new Error(`${this.constructor.name} already has its mandatory output node!`);

		this.nodes.set(node.id, node);

		if (node.constructor === this.outputNodeType)
			this.outputNodeId = node.id;

		this._nodeIdCounter = Math.max(this._nodeIdCounter, node.id + 1);
		this.structureVersion++;

		if ("graphId" in node && node.graphId !== null)
			this._manager?.notifySubgraphTopologyChanged();
	}


	public removeNode(id: number): void;
	public removeNode(node: GraphNode): void;
	public removeNode(idOrNode: number | GraphNode): void {
		const node = typeof idOrNode === "number" ? this.nodes.get(idOrNode) : idOrNode;

		if (!node || this.nodes.get(node.id) !== node)
			return;

		if (this.isOutputNode(node))
			throw new Error("The output node cannot be removed!");

		for (const edge of this.index.getConnectedEdges(node))
			this.removeEdge(edge);

		this.nodes.delete(node.id);
		this.structureVersion++;

		if ("graphId" in node && node.graphId !== null)
			this._manager?.notifySubgraphTopologyChanged();
	}

	public addEdge(source: GraphNode, sourceOutput: string, target: GraphNode, targetInput: string): NodeEdge | null {
		if (source === target || this.nodes.get(source.id) !== source || this.nodes.get(target.id) !== target)
			return null;

		const sourcePort = GraphNode.getPort(source, sourceOutput, "output");
		const targetPort = GraphNode.getPort(target, targetInput, "input");

		if (!sourcePort || !targetPort || !GraphNode.canConnect(sourcePort, targetPort))
			return null;

		const foundEdge = this.getEdge(source, sourceOutput, target, targetInput);

		if (foundEdge)
			return foundEdge;

		const edge = new NodeEdge(this._edgeIdCounter, source, sourceOutput, target, targetInput);
		const inputEdge = this.index.getInputEdge(target, targetInput);

		if (inputEdge)
			this.removeEdge(inputEdge);

		this._edgeIdCounter++;
		this.edges.set(edge.id, edge);
		this.index.add(edge);
		this.structureVersion++;

		return edge;
	}

	public removeEdge(id: number): void;
	public removeEdge(edge: NodeEdge): void;
	public removeEdge(idOrEdge: number | NodeEdge): void {
		const edge = typeof idOrEdge === "number" ? this.edges.get(idOrEdge) : idOrEdge;

		if (!edge || this.edges.get(edge.id) !== edge)
			return;

		this.edges.delete(edge.id);
		this.index.remove(edge);
		this.structureVersion++;
	}

	public restoreEdge(edge: NodeEdge): void {
		const existing = this.edges.get(edge.id);

		if (existing === edge)
			return;

		if (existing)
			throw new Error(`Edge ID ${edge.id} is already occupied in graph ${this.id}!`);

		if (this.nodes.get(edge.source.id) !== edge.source || this.nodes.get(edge.target.id) !== edge.target)
			throw new Error(`Cannot restore edge ${edge.id} with unregistered nodes!`);

		const source = GraphNode.getPort(edge.source, edge.sourceOutput, "output");
		const target = GraphNode.getPort(edge.target, edge.targetInput, "input");

		if (!source || !target || !GraphNode.canConnect(source, target))
			throw new Error(`Cannot restore invalid edge ${edge.id}!`);

		const inputEdge = this.index.getInputEdge(edge.target, edge.targetInput);

		if (inputEdge && inputEdge !== edge)
			throw new Error(`Cannot restore edge ${edge.id}: target input is occupied by edge ${inputEdge.id}!`);

		this.edges.set(edge.id, edge);
		this.index.add(edge);
		this._edgeIdCounter = Math.max(this._edgeIdCounter, edge.id + 1);
		this.structureVersion++;
	}

	public reconcileEdges(): void {
		if (this._reconcilingEdges)
			return;

		this._reconcilingEdges = true;

		try {
			for (const edge of [...this.edges.values()]) {
				const source = GraphNode.getPort(edge.source, edge.sourceOutput, "output");
				const target = GraphNode.getPort(edge.target, edge.targetInput, "input");

				if (!source || !target || !GraphNode.canConnect(source, target))
					this.removeEdge(edge);
			}
		} finally {
			this._reconcilingEdges = false;
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

		this.notifyInterfaceChanged();
	}

	public removeInterfacePort(direction: "input" | "output", id: string): void {
		const ports = direction === "input" ? this.inputs : this.outputs;

		if (!ports.some(port => port.id === id))
			return;

		if (direction === "input") {
			this.removeInterfaceNodes(id);
			this.inputs = this.inputs.filter(port => port.id !== id);
		} else {
			this.outputs = this.outputs.filter(port => port.id !== id);
		}

		this.notifyInterfaceChanged();
	}

	private removeInterfaceNodes(id: string): void {
		for (const node of [...this.nodes.values()]) {
			if ("interfaceId" in node && node.interfaceId === id)
				this.removeNode(node);
		}
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
	public readonly outputNodeType = WorldOutputNode;
}

@observable
@serializable({ type: "graph:subgraph", create: data => new Subgraph(data.id, data.name) })
export class Subgraph extends Graph {
	public readonly outputNodeType = GraphOutputNode;
}

@observable
@serializable({ type: "graph:pass", create: data => new PassGraph(data.id, data.name) })
export class PassGraph extends Graph {
	public readonly outputNodeType = PassOutputNode;

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
	public readonly outputNodeType = SimulationOutputNode;

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

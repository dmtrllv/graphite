import { Allocator } from "@utils/allocator";
import { Node, type NodeInputPortName, type NodeOutputPortName, type NodeType } from "./nodes/node";
import type { Type } from "../types";
import type { GraphManager } from "./graph-manager";
import { GraphError, GraphErrorType } from "./error";
import { GraphOutputNode } from "./nodes";

export abstract class Graph {
	public readonly id: number;

	public name: string;

	protected readonly manager: GraphManager;

	private readonly _nodes: Allocator<Node>;
	private readonly _edges: Allocator<Edge<this, any, any, any>>;

	private _outputNode: Node | undefined;
	
	public get outputNode(): Node {
		if (this._outputNode === undefined)
			throw new GraphError(this, GraphErrorType.NotInitialized);
		return this._outputNode;
	}

	public get nodes(): GraphNodeType<this>[] {
		return Array.from(this._nodes.iter()) as GraphNodeType<this>[];
	}

	public get edges(): Edge<this>[] {
		return Array.from(this._edges.iter()) as Edge<this>[];
	}

	public get inputs(): GraphIO {
		return {};
	}

	public get outputs(): GraphIO {
		return {};
	}

	public abstract get nodeTypes(): NodeType<any, any>[];

	public constructor(id: number, name: string, manager: GraphManager) {
		this.id = id;
		this.name = name;
		this.manager = manager;
		this._nodes = new Allocator(Node);
		this._edges = new Allocator(Edge);
	}
	
	public init() {
		this._outputNode = this.addNode(GraphOutputNode, this);
	}

	public addNode<U extends NodeType<Node, Args>, Args extends any[]>(type: U, ...args: Args): InstanceType<U> {
		const node = this._nodes.allocWithId(type, ...args);
		try {
			this.manager.validateNode(this, node);
			return node;
		} catch (e) {
			this._nodes.free(node.id);
			throw e;
		}
	}

	public removeNode(node: GraphNodeType<this>) {
		if (!this._nodes.includes(node))
			throw new GraphError(this, GraphErrorType.InvalidNode, node);

		for (const edge of Object.values(node["_inputEdges"]))
			if (edge)
				this.removeEdge(edge as Edge);

		for (const edges of Object.values(node["_outputEdges"]))
			for (const edge of [...edges as Edge[]])
				this.removeEdge(edge);

		this._nodes.free(node.id);
	}

	public connect<A extends GraphNodeType<this>, K extends NodeOutputPortName<A>, B extends GraphNodeType<this>>(sourceNode: A, sourceOutputPort: K, target: B, targetInputPort: MatchingNodeInputPortNames<B, A, K>) {
		if (!this._nodes.includes(sourceNode))
			throw new GraphError(this, GraphErrorType.InvalidNode, sourceNode);

		if (!this._nodes.includes(target))
			throw new GraphError(this, GraphErrorType.InvalidNode, target);

		const oldInputEdge = target["_inputEdges"][targetInputPort];

		if (oldInputEdge)
			this.removeEdge(oldInputEdge);

		const edge = this._edges.allocWithId(Edge, sourceNode, sourceOutputPort, target, targetInputPort);

		target["_inputEdges"][targetInputPort] = edge;

		if (!sourceNode["_outputEdges"][sourceOutputPort])
			sourceNode["_outputEdges"][sourceOutputPort] = [];

		sourceNode["_outputEdges"][sourceOutputPort].push(edge);

		return edge;
	}

	public removeEdge(edge: Edge<this>) {
		if (!this._edges.includes(edge))
			throw new GraphError(this, GraphErrorType.InvalidEdge, undefined, edge);

		const outputEdges = edge.sourceNode["_outputEdges"][edge.outputPort];

		if (outputEdges) {
			const index = outputEdges.indexOf(edge);

			if (index !== -1)
				outputEdges.splice(index, 1);
		}

		edge.target["_inputEdges"][edge.inputPort] = undefined;

		this._edges.free(edge.id);
	}
}

export type GraphType<T extends Graph, Args extends any[]> = new (id: number, name: string, manager: GraphManager, ...args: Args) => T;

export type GraphInputName<T extends Graph> = keyof T["inputs"];
export type GraphOutputName<T extends Graph> = keyof T["outputs"];

export class Edge<G extends Graph = any, A extends GraphNodeType<G> = any, K extends NodeOutputPortName<A> = any, B extends GraphNodeType<G> = any> {
	public readonly id: number;
	public readonly sourceNode: A;
	public readonly outputPort: K;
	public readonly target: B;
	public readonly inputPort: MatchingNodeInputPortNames<B, A, K>;

	public constructor(id: number, sourceNode: A, outputPort: K, target: B, inputPort: MatchingNodeInputPortNames<B, A, K>) {
		this.id = id;
		this.sourceNode = sourceNode;
		this.outputPort = outputPort;
		this.target = target;
		this.inputPort = inputPort;
	}
}

export type MatchingNodeInputPortNames<B extends Node, A extends Node, OutputKey extends NodeOutputPortName<A>> = {
	[K in NodeInputPortName<B>]: A["outputs"][OutputKey] extends B["inputs"][K] ? K : never;
}[NodeInputPortName<B>];

export type GraphNodeType<T extends Graph> = InstanceType<T["nodeTypes"][number]> & Node;

export type GraphIO = Record<string, Type>;

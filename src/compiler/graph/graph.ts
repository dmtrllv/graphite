import { Allocator } from "@utils/allocator";
import { Node } from "./nodes/node";
import type { Type } from "../types";
import type { GraphManager } from "./graph-manager";

export abstract class Graph {
	public readonly id: number;
	
	public name: string;
	
	protected readonly manager: GraphManager;
	
	private readonly nodes: Allocator<Node>;
	private readonly edges: Allocator<Edge<this, any, any, any>>;

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
		this.nodes = new Allocator(Node);
		this.edges = new Allocator(Edge);
	}

	public addNode<U extends NodeType<Node, Args>, Args extends any[]>(type: U, ...args: Args): InstanceType<U> {
		return this.nodes.allocWithId(type, ...args);
	}

	public removeNode(node: GraphNodeType<this>) {
		for (const edge of Object.values(node["_inputEdges"]))
			if (edge)
				this.removeEdge(edge as Edge);

		for (const edges of Object.values(node["_outputEdges"]))
			for (const edge of [...edges as Edge[]])
				this.removeEdge(edge);

		this.nodes.free(node.id);
	}

	public getNodes(): GraphNodeType<this>[] {
		return Array.from(this.nodes.iter()) as GraphNodeType<this>[];
	}

	public connect<A extends GraphNodeType<this>, K extends NodeOutputPortName<A>, B extends GraphNodeType<this>>(sourceNode: A, sourceOutputPort: K, target: B, targetInputPort: MatchingNodeInputPortNames<B, A, K>) {
		const oldInputEdge = target["_inputEdges"][targetInputPort];

		if (oldInputEdge)
			this.removeEdge(oldInputEdge);

		const edge = this.edges.allocWithId(Edge, sourceNode, sourceOutputPort, target, targetInputPort);

		target["_inputEdges"][targetInputPort] = edge;

		if (!sourceNode["_outputEdges"][sourceOutputPort])
			sourceNode["_outputEdges"][sourceOutputPort] = [];

		sourceNode["_outputEdges"][sourceOutputPort].push(edge);

		return edge;
	}

	public removeEdge(edge: Edge<this>) {
		const outputEdges = edge.sourceNode["_outputEdges"][edge.outputPort];

		if (outputEdges) {
			const index = outputEdges.indexOf(edge);

			if (index !== -1)
				outputEdges.splice(index, 1);
		}

		edge.target["_inputEdges"][edge.inputPort] = undefined;

		this.edges.free(edge.id);
	}

	public getEdges(): Edge<this>[] {
		return Array.from(this.edges.iter()) as Edge<this>[];
	}
}

export type GraphType<T extends Graph, Args extends any[]> = new (id: number, name: string, manager: GraphManager, ...args: Args) => T;

export type NodePorts = Record<string, Type>;

export type NodeType<T extends Node, Args extends any[]> = new (id: number, ...args: Args) => T;

export type GraphInputName<T extends Graph> = keyof T["inputs"];
export type GraphOutputName<T extends Graph> = keyof T["outputs"];

export type NodeInputPortName<T extends Node> = keyof T["inputs"];
export type NodeOutputPortName<T extends Node> = keyof T["outputs"];

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

import { Allocator, assert } from "@utils";
import { Node, type NodeType } from "./nodes/node";
import type { Type } from "../types";
import { getNodeType, GraphOutputNode } from "./nodes";

export abstract class Graph {
	public readonly id: number;
	public readonly nodes: Allocator<Node>;
	public readonly edges: Allocator<Edge>;

	public get outputNode() {
		const node = assert.notNull(this.nodes.get(0));
		assert(() => node instanceof GraphOutputNode, `First node is not an GraphOutputNode!`);
		return node;
	}

	public get inputs(): GraphIO {
		return {};
	}

	public get outputs(): GraphIO {
		return {};
	}

	public name: string;

	public abstract get nodeTypes(): NodeType<any, any>[];

	public constructor(id: number, name: string, nodes: Node[] = [], edges: Edge[] = []) {
		this.id = id;
		this.name = name;
		this.nodes = new Allocator(Node);
		this.edges = new Allocator(Edge);
		nodes.forEach(node => this.nodes.allocAt(node.id, getNodeType(node.type), node.id, this.id, node.props as any));
		edges.forEach(edge => this.edges.allocWithId(Edge, edge))
	}

	public serialize(): SerializedGraph {
		return {
			type: this.constructor.name,
			id: this.id,
			name: this.name,
			nodes: this.nodes.all(),
			edges: this.edges.all(),
		};
	}
}

export type SerializedGraph = {
	readonly type: string;
	readonly id: number;
	readonly name: string;
	readonly nodes: Node[];
	readonly edges: Edge[];
}

export type GraphType<T extends Graph> = new (id: number, name: string, nodes?: Node[], edges?: Edge[]) => T;

export type GraphInputName<T extends Graph> = keyof T["inputs"];
export type GraphOutputName<T extends Graph> = keyof T["outputs"];

export class Edge {
	public readonly id!: number;
	public readonly source!: number;
	public readonly outputPort!: string;
	public readonly target!: number;
	public readonly inputPort!: string;

	public constructor(id: number, { source: sourceNode, outputPort, target, inputPort }: EdgeProps) {
		this.id = id;
		this.source = sourceNode;
		this.outputPort = outputPort;
		this.target = target;
		this.inputPort = inputPort;
	}
}

export type EdgeProps = Omit<Edge, "id">;

export type GraphNodeType<T extends Graph> = InstanceType<T["nodeTypes"][number]>;

export type GraphIO = Record<string, Type>;

import { assert } from "../utils";
import type { GraphManager } from "./manager";
import type { Node } from "./node";
import { type SubGraphNode } from "./nodes";
import type { SubGraph } from "./subgraph";
import type { Type } from "./types";

export abstract class Graph<Props extends {} = {}> {
	public readonly id: number;
	public readonly props: GraphProps<Props>;

	protected readonly manager: GraphManager;

	public get inputTypes(): GraphIOMap { return {}; }
	public get outputTypes(): GraphIOMap { return {}; }

	public abstract get nodeTypes(): readonly typeof Node<any, any>[];

	public readonly outputNode: GraphOutputNode<this>;

	public constructor(id: number, manager: GraphManager, props: GraphProps<Props>) {
		this.manager = manager;
		this.id = id;
		this.props = props;
		this.outputNode = new GraphOutputNode(this);
	}

	public addNode<N extends typeof SubGraphNode<T>, T extends SubGraph<any,any>>(type: N, props: { graph: T }): SubGraphNode<T>;
	public addNode<T extends typeof Node<any, any>>(type: T, props: NodeTypeInitProps<T>): InstanceType<T>;
	public addNode<T extends typeof Node<any, any>>(type: T, props: NodeTypeInitProps<T>): InstanceType<T> {
		return this.manager.addNode(this, type as any, props);
	}

	public addInputNode<K extends GraphInputKey<this>>(key: K): GraphInputNode<this, K> {
		assert(key in this.inputTypes);
		return this.manager.addNode(this, GraphInputNode, { graph: this, key });
	}
}

type NodeTypeInitProps<T> = T extends new (id: number, manager: GraphManager, graph: Graph, props: infer P) => Node<any, any> ? P : never;

export type GraphProps<T extends {} = {}> = Readonly<T> & {
	readonly name: string;
};

export type InferGraphProps<T extends Graph> = T extends Graph<infer P> ? P : never;

export type GraphType<T extends Graph<Props> = Graph<any>, Props extends {} = {}> = new (id: number, manager: GraphManager, props: GraphProps<Props>) => T;

export type GraphIOMap = Record<string, Type>;

export type GraphInputTypes<T extends Graph> = T["inputTypes"];
export type GraphOutputTypes<T extends Graph> = T["outputTypes"];

export type GraphInputKey<T extends Graph> = keyof T["inputTypes"];
export type GraphOutputKey<T extends Graph> = keyof T["outputTypes"];

export type GraphInputType<T extends Graph, K extends GraphInputKey<T>> = GraphInputTypes<T>[K];
export type GraphOutputType<T extends Graph, K extends GraphOutputKey<T>> = GraphOutputTypes<T>[K];

export type AllowedGraphNode<T extends Graph> = InstanceType<T["nodeTypes"][number]> extends Node<any, any> ? InstanceType<T["nodeTypes"][number]> : never;

export class GraphInputNode<T extends Graph, K extends GraphInputKey<T>> {
	
}

export class GraphOutputNode<T extends Graph> {
	public readonly graph: T;
	
	public constructor(graph: T) {
		this.graph = graph;
	}
}
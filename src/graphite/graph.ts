import type { GraphManager } from "./manager";
import type { InferNodeState, Node, NodeType } from "./node";
import { GraphInputNode, GraphOutputNode } from "./nodes/graph";
import type { Type } from "./types";

export abstract class Graph<I extends GraphIOTypes = GraphIOTypes, O extends GraphIOTypes = GraphIOTypes, State extends {} = {}> {
	public readonly id: number;
	public readonly state: GraphState<State>;

	protected readonly manager: GraphManager;

	public get requiredInputTypes(): Partial<I> { return {}; }
	public get requiredOutputTypes(): Partial<O> { return {}; }

	public readonly inputs: I;
	public readonly outputs: O;

	public get outputNode(): GraphOutputNode<this> {
		return this.manager.getGraphOutputNode(this);
	}

	public constructor(id: number, manager: GraphManager, state: GraphState<State> & GraphIOState<I, O>) {
		this.id = id;
		this.manager = manager;
		this.state = state;

		this.inputs = {
			...this.requiredInputTypes,
			...(state.inputs || {} as I)
		};

		this.outputs = {
			...this.requiredOutputTypes,
			...(state.outputs || {} as O)
		};
	}

	private setInput<K extends keyof I>(key: K, type: I[K]) {
		this.inputs[key] = type;
	}

	private setOutput<K extends keyof O>(key: K, type: O[K]) {
		this.outputs[key] = type;
	}

	//public addInputNode<This extends Graph<I, any, any>, K extends GraphInputKey<This>>(this: This, key: K): GraphInputNode<This, K> {
	//	return this.manager.addNode(this, GraphInputNode, { graph: this, key: key.toString() }) as GraphInputNode<This, K>;
	//}

	public addInputNode<This extends Graph, K extends GraphInputKey<This>>(key: K) {
		return this.manager.addNode(this, GraphInputNode, { key, graph: this }) as GraphInputNode<This, K>;
	}

	public addNode<T extends Node>(type: NodeType<T>, state: InferNodeState<T>): T {
		return this.manager.addNode(this, type, state);
	}
}

export type GraphState<T extends {} = {}> = T & {
	readonly name: string;
};

export type GraphIOState<I extends GraphIOTypes = GraphIOTypes, O extends GraphIOTypes = GraphIOTypes> = {
	readonly inputs?: I;
	readonly outputs?: O;
};

export type InferGraphState<T extends Graph> = T extends Graph<any, any, infer S> ? GraphState<S> : never;

export type GraphIOTypes = Record<string, Type>;

export type GraphInputKey<T extends Graph> = T extends Graph<infer I, any, any> ? keyof I : string;
export type GraphOutputKey<T extends Graph> = T extends Graph<any, infer O, any> ? keyof O : string;

export type GraphInputTypes<T extends Graph> = T extends Graph<infer I, any, any> ? I : GraphIOTypes;

export type GraphType<T extends Graph<I, O, State>, I extends GraphIOTypes, O extends GraphIOTypes, State extends {} = any> = new (id: number, manager: GraphManager, state: GraphState<State>) => T;

interface DynamicInterface {
	setInput(key: string, type: Type): void;
	setOutput(key: string, type: Type): void;
}

export type DynamicGraph<T extends Graph> = Omit<T, keyof DynamicInterface> & DynamicInterface;
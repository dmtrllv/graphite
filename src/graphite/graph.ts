import type { GraphManager } from "./manager";
import type { Node, NodeConstructorState, NodeType } from "./node";
import { GraphInputNode, GraphNode, GraphOutputNode } from "./nodes/graph";
import type { Type } from "./types";

export abstract class Graph<I extends GraphIOTypes = GraphIOTypes, O extends GraphIOTypes = GraphIOTypes, State extends {} = {}> {
	public readonly id: number;
	public readonly state: GraphState<State>;

	protected readonly manager: GraphManager;

	public get requiredInputTypes(): Partial<I> { return {}; }
	public get requiredOutputTypes(): Partial<O> { return {}; }

	public readonly inputs: I;
	public readonly outputs: O;

	public get outputNode(): Omit<GraphOutputNode<this>, "remove"> {
		return this.manager.getGraphOutputNode(this);
	}

	public get name(): string {
		return this.state.name;
	}

	public constructor(id: number, manager: GraphManager, { inputs = {} as I, outputs = {} as O, ...state }: GraphState<State> & GraphIOState<I, O>) {
		this.id = id;
		this.manager = manager;
		
		this.state = state as GraphState<State>;

		this.inputs = {
			...this.requiredInputTypes,
			...inputs,
		};

		this.outputs = {
			...this.requiredOutputTypes,
			...outputs,
		};

		Object.assign(this, {
			setInput: <K extends keyof this["inputs"]>(key: K, type: this["inputs"][K]) => this.inputs[key] = type,
			setOutput: <K extends keyof this["outputs"]>(key: K, type: this["outputs"][K]) => this.outputs[key] = type,
			removeInput: <K extends keyof this["inputs"]>(key: K) => delete this.inputs[key],
			removeOutput: <K extends keyof this["outputs"]>(key: K) => delete this.outputs[key],
		});
	}

	public addInputNode<This extends Graph, K extends GraphInputKey<This>>(key: K): GraphInputNode<This, K> {
		return this.manager.addNode(this, GraphInputNode, { key, graph: this } as any) as GraphInputNode<This, K>;
	}

	public addNode<T extends Node<any>>(type: NodeType<T, any>, state: NodeConstructorState<T>): T {
		return this.manager.addNode(this, type as any, state);
	}

	public addGraphNode<T extends Graph>(graph: T): GraphNode<T> {
		return this.manager.addNode(this, GraphNode, { graph })
	}

	public remove() {
		this.manager.removeGraph(this);
	}

	public toJSON() {
		return {
			id: this.id,
			state: {
				...this.state,
				inputs: this.inputs,
				outputs: this.outputs,
			},
			nodes: this.manager.getNodes(this),
			edges: this.manager.getEdges(this),
		};
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

export type DynamicGraph<T> = T & {
	readonly setInput: (key: string, type: Type) => void;
	readonly setOutput: (key: string, type: Type) => void;
	readonly removeInput: (key: string) => void;
	readonly removeOutput: (key: string) => void;
}

//export type DynamicGraph<T extends Graph> = Omit<T, keyof DynamicInterface> & DynamicInterface;
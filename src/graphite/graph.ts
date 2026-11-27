import { EventEmitter } from "@utils";
import type { SerializedEdge } from "./edge";
import type { GraphManager } from "./manager";
import type { Node, NodeConstructorState, NodePosition, NodeType, SerializedNode } from "./node";
import { GraphInputNode, GraphNode, GraphOutputNode, type GraphNodeValues } from "./nodes/graph";
import type { Type } from "./types";

export abstract class Graph<I extends GraphIOTypes = GraphIOTypes, O extends GraphIOTypes = GraphIOTypes, State extends {} = {}> extends EventEmitter<GraphEvents> {
	public static deserialize<T extends typeof Graph<I, O, any>, I extends GraphIOTypes, O extends GraphIOTypes>(this: T, state: ReturnType<InstanceType<T>["toJSON"]>): InstanceType<T>["state"] & GraphIOState<I, O> {
		return state;
	}

	public readonly id: number;
	public readonly state: GraphState<State>;

	protected readonly manager: GraphManager;

	public readonly getRevision = () => this.emitCount;

	public get type() { return this.constructor.name; }

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

	public set name(name: string) {
		Object.assign(this.state, { name });
		this.emit("name-changed", { graph: this, name });
	}

	public get nodes(): Array<Node> {
		return this.manager.getNodes(this);
	}

	public constructor(id: number, manager: GraphManager, { inputs = {} as I, outputs = {} as O, ...state }: GraphState<State> & GraphIOState<I, O>) {
		super();
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

	public addInputNode<This extends Graph, K extends GraphInputKey<This>>(key: K, position?: NodePosition): GraphInputNode<This, K> {
		return this.manager.addNode(this, GraphInputNode, { key, graph: this } as any, position) as GraphInputNode<This, K>;
	}

	public addNode<T extends Node<any>>(type: NodeType<T, any>, state: NodeConstructorState<T>, position?: NodePosition): T {
		const node = this.manager.addNode(this, type as any, state, position);
		this.emit("node-added", { graph: this, node });
		return node as T;
	}

	public addGraphNode<T extends Graph>(graph: T, inputs: GraphNodeValues<T>, position?: NodePosition): GraphNode<T> {
		return this.manager.addNode(this, GraphNode, { graph, inputs }, position) as GraphNode<T>;
	}

	public remove() {
		this.manager.removeGraph(this);
	}

	public removeNode(node: Node) {
		const removed = this.manager.removeNode(node);
		if(removed)
			this.emit("node-removed", { graph: this, node });
		return removed;
	}

	public toJSON(): SerializedGraph {
		return {
			id: this.id,
			type: this.type,
			state: {
				...this.state,
				inputs: this.inputs,
				outputs: this.outputs,
			},
			nodes: this.nodes.map(n => n.toJSON()),
			edges: this.manager.getEdges(this).map(e => e.toJSON()),
		};
	}

	public update(state: Partial<State>) {
		Object.assign(this.state, state);
		this.emit("state-changed", { graph: this });
	}
}

export type SerializedGraph = {
	readonly id: number;
	readonly type: string;
	readonly state: {
		readonly inputs: GraphIOTypes;
		readonly outputs: GraphIOTypes;
	};
	readonly nodes: readonly SerializedNode[];
	readonly edges: readonly SerializedEdge[];
};

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

export interface GraphType<T extends Graph<I, O, State>, I extends GraphIOTypes, O extends GraphIOTypes, State extends {} = any> {
	new(id: number, manager: GraphManager, state: GraphState<State>): T;
	deserialize<T extends typeof Graph<I, O, any>, I extends GraphIOTypes, O extends GraphIOTypes>(this: T, state: ReturnType<InstanceType<T>["toJSON"]>): InstanceType<T>["state"] & GraphIOState<I, O>;
}

export type DynamicGraph<T> = T & {
	readonly setInput: (key: string, type: Type) => void;
	readonly setOutput: (key: string, type: Type) => void;
	readonly removeInput: (key: string) => void;
	readonly removeOutput: (key: string) => void;
}

export type GraphEvents = {
	"state-changed": { graph: Graph; };
	"name-changed": { graph: Graph; name: string; };
	"node-added": { graph: Graph; node: Node; };
	"node-removed": { graph: Graph; node: Node; };
};
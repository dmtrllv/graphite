import type { Edge } from "./edge";
import type { Graph } from "./graph";
import type { GraphManager } from "./manager";
import type { Type } from "./types";

export abstract class Node<T extends Node<T, Props>, Props extends {} = {}> {
	public readonly id: number;
	public readonly props: Readonly<Props>;
	public readonly graph: Graph<{}>;

	protected readonly manager: GraphManager;

	public get inputTypes(): NodeIOMap { return {} }
	public get outputTypes(): NodeIOMap { return {} }

	public readonly inputs: NodeInputPorts<this>;
	public readonly outputs: NodeOutputPorts<this>;

	public get defaultProps(): Partial<Props> { return {}; }

	public constructor(id: number, manager: GraphManager, graph: Graph, props: NodeInitProps<T, Props>) {
		this.manager = manager;
		this.graph = graph;
		this.id = id;
		this.props = { ...this.defaultProps, ...props, } as Props;

		const inputs = {} as any;

		for (const k in this.inputTypes)
			inputs[k] = new InputPort(this.manager, this, k);

		const outputs = {} as any;

		for (const k in this.outputTypes)
			outputs[k] = new OutputPort(this.manager, this, k);
		
		this.inputs = inputs;
		this.outputs = outputs;
	}

	public update<K extends keyof Props>(key: K, value: Props[K]) {
		Object.assign(this.props, { [key]: value });
	}
}

type KeysOfType<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];
type RequiredKeys<T> = Exclude<KeysOfType<T, Exclude<T[keyof T], undefined>>, undefined>;

export type NodeInitProps<T extends Node<T, P>, P extends {}> = Omit<P, RequiredKeys<T["defaultProps"]>> & Partial<P>;

export type NodeIOMap = Record<string, Type>;

export type NodeInputTypes<T extends Node<any>> = T["inputTypes"];
export type NodeOutputTypes<T extends Node<any>> = T["outputTypes"];

export type NodeInputPorts<T extends Node<T>> = {
	readonly [K in keyof NodeInputTypes<T> extends string ? keyof NodeInputTypes<T> : never]: InputPort<T, K, NodeInputTypes<T>[K]>;
};

export type NodeOutputPorts<T extends Node<T>> = {
	readonly [K in keyof NodeOutputTypes<T>]: OutputPort<T, K, NodeOutputTypes<T>[K]>;
};

export type InferNodeProps<T extends Node<T, any>> = T extends Node<T, infer P> ? NodeInitProps<T, P> : never;

export type NodeType<T extends Node<T, P>, P extends {}> = new (id: number, manager: GraphManager, graph: Graph, props: NodeInitProps<T, P>) => T;

export class InputPort<T extends Node<T, any>, K extends keyof NodeInputTypes<T>, U extends NodeInputTypes<T>[K]> {
	private readonly manager: GraphManager;
	public readonly node: T;
	public readonly key: K;
	public readonly type: U;

	public get edge(): Edge<U, any, this> | null {
		return this.manager.getInputEdge(this) as Edge<U, any, this> | null;
	}

	public constructor(manager: GraphManager, node: T, key: K) {
		this.manager = manager;
		this.node = node;
		this.key = key;
		this.type = this.node.inputTypes[key] as any;
	}
}

export class OutputPort<T extends Node<T, any>, K extends keyof NodeOutputTypes<T>, U extends NodeOutputTypes<T>[K]> {
	private readonly manager: GraphManager;
	public readonly node: T;
	public readonly key: K;
	public readonly type: U;

	public get edges(): Edge<U, this, any>[] {
		return this.manager.getOutputEdges(this) as Edge<U, this, any>[];
	}

	public constructor(manager: GraphManager, node: T, key: K) {
		this.manager = manager;
		this.node = node;
		this.key = key;
		this.type = this.node.outputTypes[this.key] as any;
	}

	public connect<N extends Node<N, any>, Target extends InputPort<N, keyof NodeOutputTypes<N>, U>>(inputPort: Target): Edge<U, this, Target> {
		return this.manager.connect(this, inputPort);
	}
}
import { assert } from "../utils";
import type { Graph, GraphIOTypes } from "./graph";
import type { GraphManager } from "./manager";
import { InputPort, OutputPort } from "./port";
import type { Type } from "./types";

export abstract class Node<State extends {} = {}> {
	public readonly id: number;
	public readonly state: State;

	protected readonly manager: GraphManager;
	public readonly graph: Graph;

	public get type(): string { return this.constructor.name; }

	public get inputTypes(): GraphIOTypes { return {}; }
	public get outputTypes(): GraphIOTypes { return {}; }

	public get defaultState(): Partial<State> { return {}; }

	public readonly outputs = new Proxy({}, {
		get: (_, p) => new OutputPort(this.manager, this, p.toString()),
		set: () => false,
		ownKeys: () => Array.from(Object.keys(this.outputTypes)),
		getOwnPropertyDescriptor: (_, key) => ({ enumerable: true, configurable: true, value: this.outputs[key.toString()] })
	}) as NodeOutputPorts<this>;

	public readonly inputs = new Proxy({}, {
		get: (_, p) => new InputPort(this.manager, this, p.toString()),
		set: () => false,
		ownKeys: () => Array.from(Object.keys(this.inputTypes)),
		getOwnPropertyDescriptor: (_, key) => ({ enumerable: true, configurable: true, value: this.inputs[key.toString()] })
	}) as NodeInputPorts<this>;

	public getInput<T extends Type>(name: string, type: T): InputPort<any, any, T> {
		if (!(name in this.inputTypes))
			throw new Error(`${this.type} has no input port "${name}"!`);
		const t = this.inputTypes[name];
		assert(t === type, `${this.type} input port "${name} is not a ${type.name}"!`);
		return this.inputs[name] as any;
	}

	public getOutput<T extends Type>(name: string, type: T): OutputPort<any, any, T> {
		if (!(name in this.outputTypes))
			throw new Error(`${this.type} has no output port "${name}"!`);
		const t = this.outputTypes[name];
		assert(t === type, `${this.type} output port "${name} is not a ${type.name}"!`);
		return this.outputs[name] as any;
	}

	public constructor(id: number, manager: GraphManager, graph: Graph, state: State) {
		this.id = id;
		this.graph = graph;
		this.manager = manager;
		this.state = state;
	}

	public remove() {
		this.manager.removeNode(this);
	}
}

export type NodeOutputPorts<T extends Node> = {
	[K in keyof T["outputTypes"]]: OutputPort<T, K, T["outputTypes"][K]>;
}

export type NodeInputPorts<T extends Node> = {
	[K in keyof T["inputTypes"]]: InputPort<T, K, T["inputTypes"][K]>;
}

export type InferNodeState<T extends Node<any>> = T extends Node<infer S> ? S : never;

export type NodeType<T extends Node<S>, S extends {}> = new (id: number, manager: GraphManager, graph: Graph, state: any) => T;
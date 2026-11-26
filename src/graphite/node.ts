import { assert } from "../utils";
import type { RequiredKeys } from "../utils/types";
import type { Graph, GraphIOTypes } from "./graph";
import type { GraphManager } from "./manager";
import { InputPort, OutputPort } from "./port";
import type { Type } from "./types";

const NODE_CATEGORY = Symbol("NODE_CATEGORY");

export type NodeCategory<T extends string = string> = T & {
	readonly [NODE_CATEGORY]: T;
};

const TYPE_ID = Symbol("TYPE_ID");

export abstract class Node<State extends {} = {}> {
	private static readonly categoryRegistry = new Map<string, NodeCategory>();

	private static readonly typeRegistry = new Map<string, Map<string, NodeType<any, any>>>();

	public static get types(): ReadonlyMap<NodeCategory, ReadonlyMap<string, NodeType<any, any>>> {
		const map = new Map<NodeCategory, Map<string, NodeType<any, any>>>();
		for (const [category, types] of this.typeRegistry)
			map.set(this.categoryRegistry.get(category)!, types);
		return map;
	}

	public static createCategory = <T extends string>(name: T): NodeCategory<T> => {
		if (!this.categoryRegistry.has(name)) {
			this.categoryRegistry.set(name, Object.assign(name, {
				[NODE_CATEGORY]: name,
			}));
		}
		return this.categoryRegistry.get(name)! as NodeCategory<T>;
	};

	public static readonly register = <T extends typeof Node<any>>(category: NodeCategory, name: string) => (target: T, _ctx: ClassDecoratorContext) => {
		category = category.toString() as NodeCategory;
		if (!Node.typeRegistry.has(category))
			Node.typeRegistry.set(category, new Map());
		const types = Node.typeRegistry.get(category)!;
		const found = types.get(name);
		if (found)
			throw new Error(`Duplicate name ${category}.${name} for node ${found.name} and ${target.name}!`);
		types.set(name, target as any);
		Object.assign(target, { [TYPE_ID]: `${category}.${name}` });
	}

	public static get typeId(): string {
		return TYPE_ID in this ? this[TYPE_ID] as string : `${this.name}`;
	}

	public static readonly resolveType = (typeId: string): NodeType<any, any> | null => {
		const [a, b] = typeId.split(".");
		if (a && b)
			return Node.typeRegistry.get(a)?.get(b) as ResolvedNodeType<any, any> ?? null;
		return null;
	}

	protected static deserializer: NodeDeserializer<any> = (_, state) => state;

	public static readonly deserialize = <T extends NodeType<any, any>>(type: T, manager: GraphManager, data: ReturnType<InstanceType<T>["toJSON"]>["state"]): NodeConstructorState<InstanceType<T>> => (type as any).deserializer(manager, data);

	public readonly id: number;
	public readonly state: State;

	protected readonly manager: GraphManager;
	public readonly graph: Graph;

	public get type(): string {
		return (this.constructor as typeof Node).typeId;
	}

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

	public toJSON(): SerializedNode {
		return {
			id: this.id,
			type: this.type,
			state: this.state,
		}
	}
}

export type NodeDeserializer<T extends Node> = (manager: GraphManager, state: ReturnType<T["toJSON"]>["state"]) => T["state"];

export type SerializedNode = {
	readonly id: number;
	readonly type: string;
	readonly state: object;
};

export type NodeOutputPorts<T extends Node> = {
	[K in keyof T["outputTypes"]]: OutputPort<T, K, T["outputTypes"][K]>;
};

export type NodeInputPorts<T extends Node> = {
	[K in keyof T["inputTypes"]]: InputPort<T, K, T["inputTypes"][K]>;
};

export type NodeConstructorState<T extends Node<any>> =
	& Partial<Pick<T["defaultState"], RequiredKeys<T["defaultState"]>>>
	& Pick<T["state"], Exclude<keyof T["state"], RequiredKeys<T["defaultState"]>>>;

export type NodeType<T extends Node<S>, S extends {}> = {
	new(id: number, manager: GraphManager, graph: Graph, state: any): T;
}

export type ResolvedNodeType<T extends Node<S>, S extends {}> = NodeType<T, S> & {
	readonly deserialize: (manager: GraphManager, data: ReturnType<T["toJSON"]>["state"]) => NodeConstructorState<T>
};
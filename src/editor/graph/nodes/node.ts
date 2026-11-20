import { observable } from "@reactive";
import { assert, type AccessorDecorator, type WrappedAccessorDecorator } from "@utils";
import type { Graph } from "../graph";
import type { NodeEdge } from "../edge";
import { Type, Vec2 } from "../types";
import { getTypeConversion } from "../types/cast";
import { arrayOf, Serializable, registerSerializableType, serializable } from "../../serializable";

const INPUTS = Symbol("INPUTS");
const OUTPUTS = Symbol("OUTPUTS");
const OPTIONS = Symbol("OPTIONS");
const CATEGORY = Symbol("CATEGORY");

export type IOType<Node> = (typeof Type) | readonly (typeof Type)[] | ((node: Node) => Type);

export type NodeVariant<Node extends GraphNode = GraphNode> = {
	inputs?: readonly string[];
	outputs?: readonly string[];
	inputTypes?: Record<string, IOType<Node>>;
	outputTypes?: Record<string, IOType<Node>>;
};

export type NodeOptionVariants<Node extends GraphNode = GraphNode> = Record<string, NodeVariant<Node>>;


const getOwnMetadata = <T>(metadata: object, key: symbol): T => {
	const target = metadata as unknown as Record<PropertyKey, unknown>;

	if (!Object.hasOwn(target, key))
		Object.defineProperty(target, key, { value: {}, configurable: true });

	return target[key] as T;
};

export const GraphNodeCategory = {
	Value: "Values",
	Math: "Math",
	SubGraph: "Sub Graphs",
	Simulation: "Simulation",
	Unknown: "Unknown"
} as const;

type GraphNodeCategory = (typeof GraphNodeCategory)[keyof typeof GraphNodeCategory];


@observable
export abstract class GraphNode extends Serializable {
	declare private static [INPUTS]?: Record<string, NodeProp>;
	declare private static [OUTPUTS]?: Record<string, NodeProp>;
	declare private static [OPTIONS]?: Record<string, NodeProp>;
	declare private static [CATEGORY]?: GraphNodeCategory;

	static readonly #registry = new Map<string, GraphNodeType<any>>();

	public static get category(): GraphNodeCategory {
		return this[CATEGORY] || GraphNodeCategory.Unknown;
	}

	public static getRegisteredNodes = (): ReadonlyMap<string, GraphNodeType<any>> => {
		return this.#registry;
	}

	public static register = (category: GraphNodeCategory, name: string) => (target: GraphNodeType<any>, ctx: ClassDecoratorContext) => {
		GraphNode.#registry.set(name, Object.assign(target, { [CATEGORY]: category }));
		registerSerializableType(target, `node:${name}`, (data, context) => new target(data.id, context["graph"], new Vec2()));
		observable(target, ctx);
	}

	public static getInputs<T extends typeof GraphNode | Function>(target: T): Record<string, NodeProp> {
		return (target[Symbol.metadata]?.[INPUTS] ?? {}) as Record<string, NodeProp>;
	}

	public static getOutputs<T extends typeof GraphNode | Function>(target: T): Record<string, NodeProp> {
		return (target[Symbol.metadata]?.[OUTPUTS] ?? {}) as Record<string, NodeProp>;
	}

	public static getOptions<T extends typeof GraphNode | Function>(target: T): Record<string, NodeOptionProp> {
		return (target[Symbol.metadata]?.[OPTIONS] ?? {}) as Record<string, NodeOptionProp>;
	}

	public static readonly input = (editable?: boolean): AccessorDecorator => (val, context) => {
		const inputs = getOwnMetadata<Record<string, NodeProp>>(context.metadata!, INPUTS);
		inputs[context.name.toString()] = new NodeProp(context.name.toString(), editable ?? true);
		return observable(val, context);
	};

	public static readonly output = (editable?: boolean): AccessorDecorator => (val, context) => {
		const outputs = getOwnMetadata<Record<string, NodeProp>>(context.metadata!, OUTPUTS);
		outputs[context.name.toString()] = new NodeProp(context.name.toString(), editable ?? true);
		return observable(val, context);
	};

	public static readonly option = <T, Node extends GraphNode>(variants: NodeOptionVariants): WrappedAccessorDecorator<Node, T> => (val, context) => {
		const options = getOwnMetadata<Record<string, NodeOptionProp>>(context.metadata!, OPTIONS);
		options[context.name.toString()] = new NodeOptionProp(context.name.toString(), variants);
		return observable(val, context);
	};

	public static getInterface(node: GraphNode) {
		return node.getInterface();
	}

	public static getPort(node: GraphNode, key: string, direction: "input" | "output"): ResolvedNodePort | undefined {
		const ports = GraphNode.getInterface(node);
		return (direction === "input" ? ports.inputs : ports.outputs).find(port => port.key === key);
	}

	public static canConnect(source: ResolvedNodePort, target: ResolvedNodePort): boolean {
		return getTypeConversion(source.value, target.value) !== null;
	}

	@serializable(Number)
	public readonly id: number;

	@observable
	@serializable(Vec2)
	public accessor position: Vec2;

	public readonly graph: Graph;

	public get name(): string {
		return assert.notNull(GraphNode.#registry.entries().find(([_, type]) => type === this.constructor)?.[0]);
	}

	public constructor(id: number, graph: Graph, position: Vec2 = new Vec2()) {
		super();
		this.id = id;
		this.graph = graph;
		this.position = position;
	}

	public getInputEdge(inputKey: string): NodeEdge | undefined {
		return this.graph.index.getInputEdge(this, inputKey);
	}

	public getOutputEdges(outputKey: string): NodeEdge[] {
		return this.graph.index.getOutputEdges(this, outputKey);
	}

	public getPropKind(key: string): string | null {
		if (!(key in this))
			return null;

		const prop = this[key as keyof this];
		if (prop instanceof Type)
			return prop.kind;

		const inputs = GraphNode.getInputs(this.constructor);
		if (key in inputs)
			return inputs[key]!.getKind(this);

		const options = GraphNode.getOptions(this.constructor);
		if (key in options)
			return options[key]!.getKind();

		const outputs = GraphNode.getOutputs(this.constructor);
		if (key in outputs)
			return outputs[key]!.getKind(this);

		return null;
	}


	public getInterface() {
		const inputs = GraphNode.getInputs(this.constructor);
		const outputs = GraphNode.getOutputs(this.constructor);
		const options = GraphNode.getOptions(this.constructor);

		const controlledInputs = new Set<string>();
		const controlledOutputs = new Set<string>();

		for (const option of Object.values(options)) {
			for (const variant of Object.values(option.variants)) {
				variant.inputs?.forEach(name => controlledInputs.add(name));
				variant.outputs?.forEach(name => controlledOutputs.add(name));
			}
		}

		const resolveType = (type: IOType<GraphNode>, fallback: Type): Type => {
			if (Array.isArray(type)) {
				const matching = type.find(candidate => fallback instanceof candidate);
				const Constructor = matching ?? type[0]!;
				return fallback instanceof Constructor ? fallback : new (Constructor as new () => Type)();
			}

			if (typeof type === "function") {
				if (type.prototype instanceof Type) {
					const Constructor = type as any;
					return fallback instanceof Constructor ? fallback : new Constructor();
				}

				return (type as (node: GraphNode) => Type)(this);
			}

			return fallback;
		};

		const resolve = (props: Record<string, NodeProp>, direction: "input" | "output"): ResolvedNodePort[] => {
			const controlled = direction === "input" ? controlledInputs : controlledOutputs;
			const active = new Set(Object.values(props).filter(prop => !controlled.has(prop.name)).map(prop => prop.name));
			const typeOverrides = new Map<string, IOType<GraphNode>>();

			for (const option of Object.values(options)) {
				const value = this[option.name as keyof this] as unknown as NodeOption<string>;
				const variant = option.variants[value.value];

				if (!variant)
					throw new Error(`Invalid option value "${value.value}" for ${option.name}!`);

				const names = direction === "input" ? variant.inputs : variant.outputs;
				const types = direction === "input" ? variant.inputTypes : variant.outputTypes;

				for (const name of names ?? []) {
					if (!(name in props))
						throw new Error(`Option "${option.name}" references unknown ${direction} "${name}"!`);

					active.add(name);
				}

				for (const [name, type] of Object.entries(types ?? {})) {
					if (!(name in props))
						throw new Error(`Option "${option.name}" references unknown ${direction} "${name}"!`);

					typeOverrides.set(name, type);
				}
			}

			return [...active].map(key => {
				const prop = props[key]!;
				const value = this[key as keyof this];

				if (!(value instanceof Type))
					throw new Error(`Property "${key}" of ${this.constructor.name} is not a Type!`);

				return {
					key,
					name: key,
					direction,
					value: typeOverrides.has(key) ? resolveType(typeOverrides.get(key)!, value) : value,
					editable: prop.editable
				};
			});
		};

		return {
			inputs: resolve(inputs, "input"),
			outputs: resolve(outputs, "output"),
			options: Object.values(options)
		};
	}
}

export type GraphNodeJson = {
	id: number;
	position: Vec2;
}

export type ResolvedNodePort = {
	key: string;
	name: string;
	direction: "input" | "output";
	value: Type;
	editable: boolean;
};

export type GraphNodeType<T extends GraphNode> = new (id: number, graph: Graph, position?: Vec2) => T;

export const input = GraphNode.input;
export const output = GraphNode.output;
export const option = GraphNode.option;

@observable
export class NodeProp {
	public readonly name: string;
	public readonly editable: boolean;

	public constructor(name: string, editable: boolean) {
		this.name = name;
		this.editable = editable;
	}

	public getKind(node: GraphNode): string {
		const prop = node[this.name as keyof typeof node];

		if (prop instanceof Type)
			return prop.kind;

		throw new Error(`Property ${this.name} of ${node.constructor.name} is not a "Type"!`);
	}

	public isKeyOf<T extends GraphNode>(node: T): this is KeyedNodeProp<T> {
		return this.name in node;
	}
}

export type KeyedNodeProp<T extends GraphNode> = NodeProp & {
	readonly name: keyof T;
}

@observable
export class NodeOptionProp extends NodeProp {
	public readonly variants: NodeOptionVariants;

	public constructor(name: string, variants: NodeOptionVariants) {
		super(name, true);
		this.variants = variants;
	}

	public override getKind(): string {
		return "option";
	}
}

@observable
@serializable({ type: "option:base", create: () => new SelectOption([]) })
export abstract class NodeOption<T extends string> extends Serializable {
	@observable
	@serializable(String)
	public accessor value: T;

	public abstract get kind(): string;

	public constructor(value: T) {
		super();
		this.value = value;
	}
}

@observable
@serializable({ type: "option:select", create: data => new SelectOption(data.options) })
export class SelectOption<T extends readonly string[]> extends NodeOption<T[number]> {
	@serializable(arrayOf(String))
	public readonly options: T;

	public override get kind(): string {
		return "select";
	}

	public constructor(options: T) {
		super(options[0]!);
		this.options = options;
	}
}

export type NodeOptionType<T extends NodeOption<R[number]>, R extends readonly string[]> = new (options: R) => T;
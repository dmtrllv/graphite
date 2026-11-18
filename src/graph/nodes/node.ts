import { observable } from "../../reactive";
import { assert, type AccessorDecorator, type WrappedAccessorDecorator } from "../../utils";
import type { Graph, NodeEdge } from "../graph";
import { Type, Vec2 } from "../types";
import { getTypeConversion } from "../types/cast";

const INPUTS = Symbol("INPUTS");
const OUTPUTS = Symbol("OUTPUTS");
const OPTIONS = Symbol("OPTIONS");

export type NodeVariant = {
	inputs?: readonly string[];
	outputs?: readonly string[];
};

export type NodeOptionVariants = Record<string, NodeVariant>;

const getOwnMetadata = <T>(metadata: object, key: symbol): T => {
	const target = metadata as unknown as Record<PropertyKey, unknown>;

	if (!Object.hasOwn(target, key))
		Object.defineProperty(target, key, { value: {}, configurable: true });

	return target[key] as T;
};

export abstract class GraphNode {
	declare private static [INPUTS]?: Record<string, NodeProp>;
	declare private static [OUTPUTS]?: Record<string, NodeProp>;
	declare private static [OPTIONS]?: Record<string, NodeProp>;

	static readonly #registry = new Map<string, GraphNodeType<any>>();

	public static getRegisteredNodes = (): ReadonlyMap<string, GraphNodeType<any>> => {
		return this.#registry;
	}

	public static register = (name: string) => (target: GraphNodeType<any>, _: ClassDecoratorContext) => {
		if (GraphNode.#registry.has(name))
			throw new Error(`GraphNode with name ${name} is already registered!`);
		GraphNode.#registry.set(name, target);
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

	public static readonly input = (): AccessorDecorator => (val, context) => {
		const inputs = getOwnMetadata<Record<string, NodeProp>>(context.metadata!, INPUTS);
		inputs[context.name.toString()] = new NodeProp(context.name.toString());
		return observable({ recursive: true })(val, context);
	};

	public static readonly output = (): AccessorDecorator => (val, context) => {
		const outputs = getOwnMetadata<Record<string, NodeProp>>(context.metadata!, OUTPUTS);
		outputs[context.name.toString()] = new NodeProp(context.name.toString());
		return observable({ recursive: true })(val, context);
	};

	public static readonly option = <T, Node extends GraphNode>(variants: NodeOptionVariants): WrappedAccessorDecorator<Node, T> => (val, context) => {
		const options = getOwnMetadata<Record<string, NodeOptionProp>>(context.metadata!, OPTIONS);
		options[context.name.toString()] = new NodeOptionProp(context.name.toString(), variants);
		return observable({ recursive: true })(val, context);
	};

	public static getInterface(node: GraphNode) {
		const inputs = GraphNode.getInputs(node.constructor);
		const outputs = GraphNode.getOutputs(node.constructor);
		const options = GraphNode.getOptions(node.constructor);

		const controlledInputs = new Set<string>();
		const controlledOutputs = new Set<string>();

		for (const option of Object.values(options)) {
			for (const variant of Object.values(option.variants)) {
				variant.inputs?.forEach(name => controlledInputs.add(name));
				variant.outputs?.forEach(name => controlledOutputs.add(name));
			}
		}

		const resolve = (props: Record<string, NodeProp>, direction: "input" | "output"): ResolvedNodePort[] => {
			const controlled = direction === "input" ? controlledInputs : controlledOutputs;
			const active = new Set(Object.values(props).filter(prop => !controlled.has(prop.name)).map(prop => prop.name));

			for (const option of Object.values(options)) {
				const value = node[option.name as keyof typeof node] as unknown as NodeOption<string>;
				const variant = option.variants[value.value];

				if (!variant)
					throw new Error(`Invalid option value "${value.value}" for ${option.name}!`);

				const names = direction === "input" ? variant.inputs : variant.outputs;

				for (const name of names ?? []) {
					if (!(name in props))
						throw new Error(`Option "${option.name}" references unknown ${direction} "${name}"!`);

					active.add(name);
				}
			}

			return [...active].map(name => {
				const value = node[name as keyof typeof node];

				if (!(value instanceof Type))
					throw new Error(`Property "${name}" of ${node.constructor.name} is not a Type!`);

				return { name, direction, value };
			});
		};

		return {
			inputs: resolve(inputs, "input"),
			outputs: resolve(outputs, "output"),
			options: Object.values(options)
		};
	}

	public static getPort(node: GraphNode, name: string, direction: "input" | "output"): ResolvedNodePort | undefined {
		const ports = GraphNode.getInterface(node);
		return (direction === "input" ? ports.inputs : ports.outputs).find(port => port.name === name);
	}

	public static canConnect(source: ResolvedNodePort, target: ResolvedNodePort): boolean {
		return getTypeConversion(source.value, target.value) !== null;
	}

	public readonly id: number;
	
	private readonly _graph: Graph;

	@observable
	public accessor position: Vec2;

	public get name(): string {
		return assert.notNull(GraphNode.#registry.entries().find(([_, type]) => type === this.constructor)?.[0]);
	}

	public constructor(id: number, graph: Graph, position: Vec2 = new Vec2()) {
		this.id = id;
		this._graph = graph;
		this.position = position;
	}

	public getInputEdge(inputKey: string): NodeEdge | undefined {
		return this._graph.index.getInputEdge(this, inputKey);
	}

	public getOutputEdges(outputKey: string): NodeEdge[] {
		return this._graph.index.getOutputEdges(this, outputKey);
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
}

export type GraphNodeJson = {
	id: number;
	position: Vec2;
}

export type ResolvedNodePort = {
	name: string;
	direction: "input" | "output";
	value: Type;
};

export type GraphNodeType<T extends GraphNode> = new (id: number, graph: Graph, position?: Vec2) => T;

export const input = GraphNode.input;
export const output = GraphNode.output;
export const option = GraphNode.option;

export type IOType<Node> = (typeof Type) | readonly (typeof Type)[] | ((node: Node) => Type);

export class NodeProp {
	public readonly name: string;

	public constructor(name: string) {
		this.name = name;
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

export class NodeOptionProp extends NodeProp {
	public readonly variants: NodeOptionVariants;

	public constructor(name: string, variants: NodeOptionVariants) {
		super(name);
		this.variants = variants;
	}

	public override getKind(): string {
		return "option";
	}
}

export abstract class NodeOption<T> {
	@observable
	public accessor value: T;

	public abstract get kind(): string;

	public constructor(value: T) {
		this.value = value;
	}
};

export class SelectOption<T extends readonly string[]> extends NodeOption<T[number]> {
	public override get kind(): string {
		return "select";
	}

	public readonly options: T;

	public constructor(options: T) {
		super(options[0]!)
		this.options = options;
	}
};

export type NodeOptionType<T extends NodeOption<R>, R extends readonly string[]> = new (options: R) => T;
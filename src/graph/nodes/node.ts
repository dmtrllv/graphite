import { observable } from "../../reactive";
import { assert, type AccessorDecorator, type WrappedAccessorDecorator } from "../../utils";
import type { Graph, NodeEdge } from "../graph";
import { Type, Vec2 } from "../types";

const INPUTS = Symbol("INPUTS");
const OUTPUTS = Symbol("OUTPUTS");
const OPTIONS = Symbol("OPTIONS");

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

	public static hasInput<Input extends GraphNode>(target: Input, targetInput: string): boolean {
		if (targetInput in GraphNode.getInputs(target.constructor))
			return true;
		const option = GraphNode.getOptions(target.constructor)[targetInput];
		return option ? option.ioType === "input" : false;
	}

	public static hasOutput<Output extends GraphNode>(source: Output, sourceOutput: string): boolean {
		if (sourceOutput in GraphNode.getOutputs(source.constructor))
			return true;
		const option = GraphNode.getOptions(source.constructor)[sourceOutput];
		return option ? option.ioType === "output" : false;
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

	public static readonly input: AccessorDecorator = (val, context): any => {
		const inputs = (context.metadata![INPUTS] ??= {}) as Record<string, NodeProp>;
		inputs[context.name.toString()] = new NodeProp(context.name.toString());
		return observable({ recursive: true })(val, context);
	};

	public static readonly output = <T, Node extends GraphNode>(): WrappedAccessorDecorator<Node, T> => (val, context) => {
		const outputs = (context.metadata![OUTPUTS] ??= {}) as Record<string, NodeProp>;
		outputs[context.name.toString()] = new NodeProp(context.name.toString());
		return observable({ recursive: true })(val, context);
	};

	public static readonly option = <T, Node extends GraphNode>(kind?: string, ioType?: "input" | "output"): WrappedAccessorDecorator<Node, T> => (val, context) => {
		const options = (context.metadata![OPTIONS] ??= {}) as Record<string, NodeOptionProp>;
		options[context.name.toString()] = new NodeOptionProp(context.name.toString(), kind, ioType)
		return observable({ recursive: true })(val, context);
	};

	public readonly id: number;
	public readonly graph: Graph;

	@observable
	public accessor position: Vec2;

	public readonly inputElements: Record<string, HTMLDivElement | null> = {};
	public readonly outputElements: Record<string, HTMLDivElement | null> = {};

	public get name(): string {
		return assert.notNull(GraphNode.#registry.entries().find(([_, type]) => type === this.constructor)?.[0]);
	}

	public constructor(id: number, graph: Graph, position: Vec2 = new Vec2()) {
		this.id = id;
		this.graph = graph;
		this.position = position;
	}

	public getInputEdge(inputKey: string): NodeEdge | undefined {
		const edge = this.graph.index.getInputEdge(this, inputKey);

		console.log("Input lookup:", this.id, input, edge);

		return edge;
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
}

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
		if (this.name in node) {
			const prop = node[this.name as keyof typeof node]!;
			if (prop instanceof Type)
				return prop.kind;
		}
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
	public readonly ioType: "input" | "output" | undefined;

	private readonly kind: string;

	public override getKind() {
		return this.kind;
	}

	public constructor(name: string, kind: string = "option", ioType?: "input" | "output") {
		super(name);
		this.kind = kind;
		this.ioType = ioType;
	}
};

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
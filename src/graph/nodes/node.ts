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

	public static readonly option = <T, Node extends GraphNode>(withInput?: boolean): WrappedAccessorDecorator<Node, T> => (val, context) => {
		const options = (context.metadata![OPTIONS] ??= {}) as Record<string, NodeOptionProp>;
		options[context.name.toString()] = new NodeOptionProp(context.name.toString(), withInput)
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
		return this.graph.edges.values().find(e => e.target === this && e.targetInput === inputKey);
	}

	public getOutputEdges(outputKey: string): NodeEdge | undefined {
		return this.graph.edges.values().find(e => e.source === this && e.sourceOutput === outputKey);
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
	public readonly withInput: boolean;

	public override getKind(node: GraphNode) {
		return "option";
	}

	public constructor(name: string, withInput: boolean = false) {
		super(name);
		this.withInput = withInput;
	}
};

export class NodeOption<T extends readonly string[]> {
	public readonly options: T;

	@observable
	public accessor value: T[number];

	public constructor(options: T) {
		this.options = options;
		this.value = options[0]!;
	}
};

export type NodeOptionType<T extends NodeOption<R>, R extends readonly string[]> = new (options: R) => T;
import type { CompiledData } from "../compiler";
import type { CompilationContext } from "../compiler/context";
import { type PassBufferRef, type Type } from "../types";
import type { GraphManager } from "../manager";

export abstract class Node<T extends {} = any> {
	public readonly id: number;
	public readonly graphId: number;
	public readonly props: NodeProps<T>;

	public get type() {
		return this.constructor.name;
	}

	public abstract compile(ctx: CompilationContext): CompiledNode | Promise<CompiledNode>;

	public getInputs(_manager: GraphManager): NodePorts {
		return {};
	}

	public getOutputs(_manager: GraphManager): NodePorts {
		return {};
	}

	public constructor(id: number, graphId: number, { position, ...props }: T & Partial<NodeProps>) {
		this.id = id;
		this.graphId = graphId;

		this.props = {
			position: position || { x: 0, y: 0 },
			...this.deserializeProps(props as T)
		};
	}

	protected deserializeProps(props: T) {
		return props;
	}

	public toJSON() {
		return {
			type: this.type,
			id: this.id,
			graphId: this.graphId,
			props: this.props
		};
	}
}

export type NodePorts = Record<string, Type>;

export type NodeType<T extends Node<Props>, Props extends {} = any> = new (id: number, graphId: number, props: Props) => T;

export const isNodeType = <T extends Node<any>>(type: any, NodeClass: NodeType<T>): type is NodeType<T> => {
	return type.prototype === NodeClass.prototype || type.prototype instanceof NodeClass;
};

export type NodeProps<T extends {} = any> = T & {
	position: {
		x: number;
		y: number;
	};
};

export type InferNodeProps<T> = T extends Node<infer Props> ? Props : never;
export type NodeInputName<T extends Node> = keyof ReturnType<T["getInputs"]>;
export type NodeOutputName<T extends Node> = keyof ReturnType<T["getOutputs"]>;

export type CompiledNode = CompiledData<{
	readonly outputs: Record<string, string | PassBufferRef>;
}>;
import { type Type } from "../../types";
import type { GraphManager } from "../graph-manager";

export abstract class Node<T extends {} = {}> {
	public readonly id: number;
	public readonly graphId: number;
	public readonly props: T;

	public get type() {
		return this.constructor.name;
	}

	public getInputs(_graph: GraphManager): NodePorts {
		return {};
	}

	public getOutputs(_graph: GraphManager): NodePorts {
		return {};
	}

	public constructor(id: number, graphId: number, props: T) {
		this.id = id;
		this.graphId = graphId;
		this.props = props;
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

export type NodeType<T extends Node<Props>, Props extends {}> = new (id: number, graphId: number, props: Props) => T;

export const isNodeType = <T extends Node<any>>(type: any, NodeClass: NodeType<T, any>): type is NodeType<T, NodeProps<T>> => {
	return type.prototype === NodeClass.prototype || type.prototype instanceof NodeClass;
};

export type NodeProps<T> = T extends Node<infer Props> ? Props : never;
export type NodeInputName<T extends Node> = keyof ReturnType<T["getInputs"]>;
export type NodeOutputName<T extends Node> = keyof ReturnType<T["getOutputs"]>;

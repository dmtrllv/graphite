import type { PrimitiveType, ToJsType } from "@graphite/types";
import type { Graph, GraphInputKey } from "../graph";
import { Node, type NodeDeserializer } from "../node";

export const GraphNodeCategory = Node.createCategory("Graph Nodes");

@Node.register(GraphNodeCategory, "Graph Input")
export class GraphInputNode<T extends Graph, K extends GraphInputKey<T>> extends Node<{ graph: T, key: K }> {
	protected static override deserializer: NodeDeserializer<GraphInputNode<Graph, any>> = (manager, { graph, key }) => ({
		graph: manager.getGraph(graph),
		key
	});

	public override get outputTypes(): MapGraphInputType<T, K> {
		return {
			value: this.graph.inputs[this.state.key]
		} as any
	}

	public override toJSON() {
		return {
			id: this.id,
			type: this.type,
			state: {
				graph: this.state.graph.id,
				key: this.state.key
			},
			position: this.position,
		}
	}
}

type MapGraphInputType<T extends Graph, K extends GraphInputKey<T>> = {
	readonly value: T["inputs"][K];
}

@Node.register(GraphNodeCategory, "Graph Outputs")
export class GraphOutputNode<T extends Graph> extends Node<{ graph: T }> {
	protected static override deserializer: NodeDeserializer<GraphOutputNode<Graph>> = (manager, { graph }) => ({
		graph: manager.getGraph(graph),
	});

	public override get inputTypes(): T["outputs"] {
		return this.graph.outputs;
	}

	public override remove(): void {
		throw new Error(`Cannot remove the graph output node!`);
	}

	public override toJSON() {
		return {
			id: this.id,
			type: this.type,
			state: {
				graph: this.state.graph.id,
			},
			position: this.position,
		}
	}
}

@Node.register(GraphNodeCategory, "Graph node")
export class GraphNode<T extends Graph> extends Node<{ graph: T, inputs: GraphNodeValues<T> }> {
	protected static override deserializer: NodeDeserializer<GraphNode<Graph>> = (manager, { graph, inputs }) => ({
		inputs,
		graph: manager.getGraph(graph),
	});

	public override get inputTypes(): T["inputs"] {
		return this.state.graph.inputs;
	}

	public override get outputTypes(): T["outputs"] {
		return this.state.graph.outputs;
	}

	public override get name(): string {
		return `${this.state.graph.name} ${this.state.graph.type}`;
	}

	public override toJSON() {
		return {
			id: this.id,
			type: this.type,
			state: {
				...this.state,
				graph: this.state.graph.id,
			},
			position: this.position,
		}
	}
}

export type GraphNodeValues<T extends Graph<any>> = {
	[K in PrimitiveKeys<T["inputs"]>]: ToJsType<T["inputs"][K]>
};

type PrimitiveKeys<T> = {
	[K in keyof T]: T[K] extends PrimitiveType ? K : never;
}[keyof T];
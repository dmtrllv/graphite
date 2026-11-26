import type { Graph, GraphInputKey } from "../graph";
import { Node, type NodeDeserializer } from "../node";

export const GraphNodeCategory = Node.createCategory("Graph Nodes");

@Node.register(GraphNodeCategory, "input")
export class GraphInputNode<T extends Graph, K extends GraphInputKey<T>> extends Node<{ graph: T, key: K }> {
	protected static override deserializer: NodeDeserializer<GraphInputNode<Graph, any>> = (manager, { graph, key }) => ({
		graph: manager.getGraph(graph),
		key
	});

	public override get outputTypes(): MapGraphInputType<T, K> {
		return {
			value: null
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
		}
	}
}

type MapGraphInputType<T extends Graph, K extends GraphInputKey<T>> = {
	readonly value: T["inputs"][K];
}

@Node.register(GraphNodeCategory, "output")
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
		}
	}
}

@Node.register(GraphNodeCategory, "node")
export class GraphNode<T extends Graph> extends Node<{ graph: T }> {
	protected static override deserializer: NodeDeserializer<GraphNode<Graph>> = (manager, { graph }) => ({
		graph: manager.getGraph(graph),
	});

	public override get inputTypes(): T["inputs"] {
		return this.state.graph.inputs;
	}

	public override get outputTypes(): T["outputs"] {
		return this.state.graph.outputs;
	}

	public override toJSON() {
		return {
			id: this.id,
			type: this.type,
			state: {
				graph: this.state.graph.id,
			},
		}
	}
}
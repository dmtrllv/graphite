import type { Graph, GraphInputKey } from "../graph";
import { Node } from "../node";

export class GraphInputNode<T extends Graph, K extends GraphInputKey<T>> extends Node<{ graph: T, key: K }> {
	public override get outputTypes(): MapGraphInputType<T, K> {
		return {
			value: null
		} as any
	}
}

type MapGraphInputType<T extends Graph, K extends GraphInputKey<T>> = {
	readonly value: T["inputs"][K];
}

export class GraphOutputNode<T extends Graph> extends Node<{ graph: T }> {
	public override get inputTypes(): T["outputs"] {
		console.log(this.graph, this.graph.outputs);
		return this.graph.outputs;
	}
}

export class GraphNode<T extends Graph> extends Node<{ graph: T }> {
	public override get inputTypes(): T["inputs"] {
		return this.state.graph.inputs;
	}

	public override get outputTypes(): T["outputs"] {
		return this.state.graph.outputs;
	}
}
import type { Graph, GraphInputKey } from "../graph";
import { Node } from "../node";

export class GraphInputNode<T extends Graph, K extends GraphInputKey<T>> extends Node<{ graph: T, key: K }> {
	public override get type(): string {
		return `${this.graph.state.name} ${this.state.key} Input`;
	}

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
	public override get type(): string {
		return `${this.graph.state.name} Outputs`;
	}

	public override get inputTypes(): T["outputs"] {
		return this.graph.outputs;
	}

	public override remove(): void {
		throw new Error(`Cannot remove the graph output node!`);
	}
}

export class GraphNode<T extends Graph> extends Node<{ graph: T }> {
	public override get type(): string {
		return `${this.state.graph.name} (Graph Node)`;
	}

	public override get inputTypes(): T["inputs"] {
		return this.state.graph.inputs;
	}

	public override get outputTypes(): T["outputs"] {
		return this.state.graph.outputs;
	}
}
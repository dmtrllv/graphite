import { assert } from "@utils";
import type { GraphManager } from "../graph-manager";
import { Node } from "./node";

export class GraphOutputNode extends Node<{ graphId: number }> {
	public override compile(): string {
		throw new Error("GraphOutputNode is a graph compilation boundary and cannot be compiled as an expression!");
	}
}

export class GraphInputNode extends Node<{ graphId: number; inputName: string; }> {
	public override getOutputs(manager: GraphManager) {
		const graph = manager.getGraph(this.props.graphId);
		return { value: assert.notNull(graph.inputs[this.props.inputName]) };
	}

	public override compile(): string {
		return `input.${this.props.inputName}`;
	}
}

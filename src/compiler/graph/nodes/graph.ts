import { assert } from "@utils";
import type { GraphManager } from "../graph-manager";
import { Node, type CompiledNode } from "./node";

export class GraphOutputNode extends Node<{ graphId: number }> {
	public override compile(): CompiledNode {
		throw new Error("GraphOutputNode is a graph compilation boundary and cannot be compiled as an expression!");
	}
}

export class GraphInputNode extends Node<{ graphId: number; inputName: string; }> {
	public override getOutputs(manager: GraphManager) {
		const graph = manager.getGraph(this.props.graphId);
		return { value: assert.notNull(graph.inputs[this.props.inputName]) };
	}

	public override compile(): CompiledNode {
		return {
			outputs: {
				value: `input.${this.props.inputName}`
			},
			statements: []
		};
	}
}

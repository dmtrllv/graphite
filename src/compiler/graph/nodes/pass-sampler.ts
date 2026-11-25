import type { CompilationContext } from "../../context";
import { Vec2 } from "../../types";
import type { GraphManager } from "../graph-manager";
import type { PassGraph } from "../pass";
import { Node, type CompiledNode } from "./node";

export class PassBufferSampler extends Node<{ graphId: number, bufferKey: string }> {
	public override getInputs(manager: GraphManager) {
		const graph = manager.getGraph(this.props.graphId) as PassGraph;

		return {
			buffer: graph.outputs[this.props.bufferKey]!,
			position: Vec2
		};
	}

	public override getOutputs(manager: GraphManager) {
		const graph = manager.getGraph(this.props.graphId) as PassGraph;

		return {
			value: graph.outputs[this.props.bufferKey]!
		};
	}

	public override compile(_ctx: CompilationContext): CompiledNode {
		throw new Error("Method not implemented.");
	}
}
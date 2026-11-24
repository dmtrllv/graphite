import { Vec2 } from "../../types";
import type { GraphManager } from "../graph-manager";
import { PassGraph } from "../pass";
import { Node } from "./node";

export class PassBufferSampler extends Node<{ graphId: number, bufferKey: string }> {
	public override getInputs(manager: GraphManager) {
		const graph = manager.getGraph(this.props.graphId, PassGraph);

		return {
			buffer: graph.outputs[this.props.bufferKey]!,
			position: Vec2
		};
	}

	public override getOutputs(manager: GraphManager) {
		const graph = manager.getGraph(this.props.graphId, PassGraph);

		return {
			value: graph.outputs[this.props.bufferKey]!
		};
	}
}
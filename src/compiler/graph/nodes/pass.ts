import type { GraphManager } from "../graph-manager";
import { PassGraph } from "../pass";
import { Node } from "./node";

export class PassNode extends Node<{ graphId: number }> {
	public override getInputs(graph: GraphManager) {
		return graph.getGraph(this.props.graphId, PassGraph).inputs;
	}

	public override getOutputs(graph: GraphManager) {
		return graph.getGraph(this.props.graphId, PassGraph).outputs;
	}
}
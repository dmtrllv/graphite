import type { GraphManager } from "../graph-manager";
import type { PassGraph } from "../pass";
import { Node } from "./node";

export class PassNode extends Node<{ graphId: number }> {
	public override getInputs(manager: GraphManager) {
		return (manager.getGraph(this.props.graphId) as PassGraph).inputs;
	}

	public override getOutputs(manager: GraphManager) {
		return (manager.getGraph(this.props.graphId) as PassGraph).outputs;
	}
}
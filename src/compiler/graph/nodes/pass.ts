import type { CompileContext } from "../../context";
import type { GraphManager } from "../graph-manager";
import { PassGraph } from "../pass";
import { Node, type CompiledNode } from "./node";

export class PassNode extends Node<{ graphId: number }> {
	public override getInputs(graph: GraphManager) {
		return graph.getGraph(this.props.graphId, PassGraph).inputs;
	}

	public override getOutputs(graph: GraphManager) {
		return graph.getGraph(this.props.graphId, PassGraph).outputs;
	}

	public override async compile(_ctx: CompileContext, _inputs: Record<string, string>): Promise<CompiledNode> {
		throw new Error("Method not implemented.");
	}
}
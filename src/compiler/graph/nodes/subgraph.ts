import type { CompileContext } from "../../context";
import type { GraphManager } from "../graph-manager";
import { Node } from "./node";

export const isSubGraphNode = (node: Node): node is SubGraphNode => node instanceof SubGraphNode;

export class SubGraphNode extends Node<{ graph: number }> {
	public override getInputs(manager: GraphManager) {
		return manager.getGraph(this.props.graph).inputs;
	}

	public override getOutputs(manager: GraphManager) {
		return manager.getGraph(this.props.graph).outputs;
	}

	public override compile(ctx: CompileContext, inputs: Record<string, string>): string {
		throw new Error("Method not implemented.");
	}
}

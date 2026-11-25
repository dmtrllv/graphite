import type { CompilationContext } from "../../context";
import type { GraphManager } from "../graph-manager";
import { Node, type CompiledNode } from "./node";

export const isSubGraphNode = (node: Node): node is SubGraphNode => node instanceof SubGraphNode;

export class SubGraphNode extends Node<{ graph: number }> {
	public override getInputs(manager: GraphManager) {
		return manager.getGraph(this.props.graph).inputs;
	}

	public override getOutputs(manager: GraphManager) {
		return manager.getGraph(this.props.graph).outputs;
	}

	public override compile(_ctx: CompilationContext): CompiledNode {
		throw new Error("Method not implemented.");
	}
}
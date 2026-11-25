import type { CompilationContext } from "../../context";
import type { GraphManager } from "../graph-manager";
import { Node, type CompiledNode, type NodePorts } from "./node";

export class GraphInputNode extends Node<{ graphId: number; inputName: string; }> {
	public override compile(_ctx: CompilationContext): CompiledNode {
		throw new Error("Method not implemented.");
	}

}

export class GraphOutputNode extends Node<{ graphId: number }> {
	public override getInputs(manager: GraphManager) {
		const graph = manager.getGraph(this.graphId);
		const ports: NodePorts = {};

		for (const edge of graph.edges.filter(edge => edge.target === this.id)) {
			const source = graph.getNode(edge.source)!;
			ports[edge.inputPort] = source.getOutputs(manager)[edge.outputPort]!;
		}

		return ports;
	}

	public override async compile(ctx: CompilationContext): Promise<CompiledNode> {
		const inputs = await ctx.resolveInputs(this);
		const outputs: Record<string, string> = {};

		for (const [name, input] of Object.entries(inputs))
			outputs[name] = input.expression;

		return {
			source: "",
			outputs
		};
	}
}

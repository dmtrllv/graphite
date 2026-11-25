import type { CompilationContext } from "../../context";
import { createPassBufferRef } from "../../types";
import type { GraphManager } from "../graph-manager";
import type { PassGraph } from "../pass";
import { Node, type CompiledNode } from "./node";

export class PassNode extends Node<{ graphId: number }> {
	public override getInputs(manager: GraphManager) {
		return (manager.getGraph(this.props.graphId) as PassGraph).inputs;
	}

	public override getOutputs(manager: GraphManager) {
		const graph = manager.getGraph(this.props.graphId) as PassGraph;
		const outputs: Record<string, ReturnType<typeof createPassBufferRef>> = {};

		for (const name of Object.keys(graph.outputs))
			outputs[name] = createPassBufferRef(graph.id, name);

		return outputs;
	}

	public override async compile(ctx: CompilationContext): Promise<CompiledNode> {
		const pass = await ctx.resolvePass(ctx.manager.getGraph(this.props.graphId) as PassGraph);
		const outputs: Record<string, string> = {};

		for (const name of Object.keys(pass.outputs))
			outputs[name] = `pass_buffer_ref_${this.props.graphId}_${name}`;

		return {
			source: "",
			outputs
		};
	}
}
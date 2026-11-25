import type { CompilationContext } from "../../context";
import { createPassBufferRef, type PassBufferRef } from "../../types";
import type { GraphManager } from "../graph-manager";
import type { PassGraph } from "../pass";
import { Node, type CompiledNode } from "./node";

export class PassNode extends Node<{ graphId: number }> {
	public override getInputs(manager: GraphManager) {
		return (manager.getGraph(this.props.graphId) as PassGraph).inputs;
	}

	public override getOutputs(manager: GraphManager) {
		const graph = manager.getGraph(this.props.graphId) as PassGraph;
		const outputs: Record<string, PassBufferRef> = {};

		for (const name of Object.keys(graph.outputs))
			outputs[name] = createPassBufferRef(graph.id, name);

		return outputs;
	}

	public override compile(ctx: CompilationContext): CompiledNode {
		const outputs: Record<string, PassBufferRef> = {};

		for (const name of Object.keys(this.getOutputs(ctx.manager)))
			outputs[name] = createPassBufferRef(this.props.graphId, name);

		return {
			source: "",
			outputs
		};
	}
}
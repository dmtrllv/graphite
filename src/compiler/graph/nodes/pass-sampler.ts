import type { CompilationContext } from "../../context";
import { createPassBufferRef, Vec2 } from "../../types";
import type { GraphManager } from "../graph-manager";
import type { PassGraph } from "../pass";
import { Node, type CompiledNode } from "./node";

export class PassBufferSampler extends Node<{ graphId: number, bufferKey: string }> {
	public override getInputs() {
		return {
			buffer: {
				name: "pass-buffer-ref" as const,
				graphId: this.props.graphId,
				bufferKey: this.props.bufferKey
			},
			position: Vec2
		};
	}

	public override getOutputs(manager: GraphManager) {
		const graph = manager.getGraph(this.props.graphId) as PassGraph;

		return {
			value: graph.outputs[this.props.bufferKey]!
		};
	}

	public override async compile(ctx: CompilationContext): Promise<CompiledNode> {
		const ref = createPassBufferRef(this.props.graphId, this.props.bufferKey);

		const graph = ctx.manager.getGraph(this.props.graphId) as PassGraph;
		const pass = await ctx.resolvePass(graph);
		const output = pass.outputs[this.props.bufferKey];

		if (!output)
			throw new Error(`Missing pass buffer "${this.props.bufferKey}" in graph ${this.props.graphId}!`);

		const binding = ctx.getPassBufferBinding(ref);
		const position = await ctx.resolveInput(this, "position");

		const expression = position?.expression ?? "world_position";

		return {
			source: "",
			outputs: {
				value: `pass_buffer_${binding}[u32(${expression}.y - chunk.chunk_origin.y) * CHUNK_SIZE + u32(${expression}.x - chunk.chunk_origin.x)]`
			}
		};
	}
}
import type { CompilationContext } from "../compiler/context";
import { createPassBufferRef, Vec2, type PassBufferRef } from "../types";
import type { GraphManager } from "../manager";
import type { PassGraph } from "../pass";
import { Node, type CompiledNode } from "./node";

export class PassBufferSampler extends Node<{}> {
	public override getInputs() {
		return {
			buffer: createPassBufferRef(0, ""),
			position: Vec2
		};
	}

	public override getOutputs(manager: GraphManager) {
		const graph = manager.getGraph(this.graphId);
		const edge = graph.edges.find(edge => edge.target === this.id && edge.inputPort === "buffer");

		if (!edge)
			return {};

		const source = graph.getNode(edge.source);

		if (!source)
			return {};

		const ref = source.getOutputs(manager)[edge.outputPort] as PassBufferRef;
		const pass = manager.getGraph(ref.graphId) as PassGraph<{}>;

		return {
			value: pass.outputs[ref.bufferKey]!
		};
	}

	public override async compile(ctx: CompilationContext): Promise<CompiledNode> {
		const ref = await ctx.resolvePassBufferInput(this, "buffer");

		if (!ref)
			throw new Error(`Missing pass buffer input on node ${this.id}!`);

		const graph = ctx.manager.getGraph(ref.graphId) as PassGraph<{}>;
		const pass = await ctx.resolvePass(graph);
		const output = pass.outputs[ref.bufferKey];

		if (!output)
			throw new Error(`Missing pass buffer "${ref.bufferKey}" in graph ${ref.graphId}!`);

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
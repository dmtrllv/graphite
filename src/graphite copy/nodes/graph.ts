import type { CompilationContext } from "../compiler/context";
import type { Graph } from "../graph";
import type { GraphManager } from "../manager";
import { type PassBufferRef } from "../types";
import { Node, type CompiledNode } from "./node";

export type GraphInputProps = { graphId: number; inputName: string; };

export class GraphInputNode extends Node<GraphInputProps> {
	public override getOutputs(manager: GraphManager) {
		const graph = manager.getGraph(this.graphId);
		return {
			value: graph.inputs[this.props.inputName]!
		};
	}

	public override compile(ctx: CompilationContext): CompiledNode {
		const graph = ctx.manager.getGraph(this.graphId);
		const input = graph.inputs[this.props.inputName];

		return {
			source: "",
			outputs: {
				value: input && typeof input === "object" && input.name === "pass-buffer-ref" ? ctx.manager.resolvePassInput(this.graphId, this.props.inputName) : this.props.inputName
			}
		};
	}
}

export class GraphOutputNode<T extends Graph = Graph> extends Node<{ graphId: number }> {
	public override getInputs(manager: GraphManager): T["outputs"] {
		return manager.getGraph(this.props.graphId).outputs as T["outputs"];
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

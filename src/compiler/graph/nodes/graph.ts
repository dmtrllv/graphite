import type { CompilationContext } from "../../context";
import type { GraphManager } from "../graph-manager";
import { Node, type CompiledNode, type NodePorts } from "./node";

export type GraphInputProps = { graphId: number; inputName: string; };

export class GraphInputNode extends Node<GraphInputProps> {
	public override getOutputs(manager: GraphManager) {
		const graph = manager.getGraph(this.graphId);
		return {
			value: graph.inputs[this.props.inputName]!
		};
	}

	public override compile(_ctx: CompilationContext): CompiledNode {
		return {
			source: "",
			outputs: {
				value: this.props.inputName
			}
		};
	}
}

export class GraphOutputNode extends Node<{ graphId: number }> {
	public override getInputs(manager: GraphManager) {
		return manager.getGraph(this.graphId).outputs;
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

import { assert } from "@utils";
import type { CompileContext } from "../../context";
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

	public override async compile(ctx: CompileContext, inputs: Record<string, string>): Promise<CompiledNode> {
		const graph = ctx.manager.getGraph(this.props.graph);
		const compiled = await ctx.compiler.compile(graph);

		const variable = ctx.createVariable();
		const arguments_ = Object.keys(graph.inputs).map(name => assert.notNull(inputs[name], `Missing subgraph input "${name}"!`));

		return {
			outputs: Object.fromEntries(Object.keys(graph.outputs).map(name => [name, `${variable}.${name}`])),
			statements: [
				`let ${variable} = ${compiled.functionName}(${compiled.inputType}(${arguments_.join(", ")}));`
			]
		};
	}
}
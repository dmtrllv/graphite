import type { CompilationContext } from "../compiler/context";
import type { GraphManager } from "../manager";
import { Node, type CompiledNode, type NodePorts } from "./node";

export class GroupInputNode<P extends {}> extends Node<GroupNodeProps<P>> {
	public override getInputs(manager: GraphManager) {
		const graph = manager.getGraph(this.graphId);
		const ports: NodePorts = {};

		for (const edge of graph.edges.filter(edge => edge.target === this.id)) {
			const source = graph.getNode(edge.source)!;
			ports[`${source.type}_${source.id}`] = source.getOutputs(manager)[edge.outputPort]!;
		}

		return ports;
	}

	public override getOutputs(manager: GraphManager): NodePorts {
		return this.getInputs(manager);
	}

	public override compile(_ctx: CompilationContext): CompiledNode {
		throw new Error("Method not implemented.");
	}
}

export class GroupOutputNode<P extends {}> extends Node<GroupNodeProps<P>> {
	public override getInputs(manager: GraphManager): NodePorts {
		const graph = manager.getGraph(this.graphId);
		const ports: NodePorts = {};

		for (const edge of graph.edges.filter(edge => edge.target === this.id)) {
			const source = graph.getNode(edge.source)!;
			ports[`${source.type}_${source.id}`] = source.getOutputs(manager)[edge.outputPort]!;
		}

		return ports;
	}

	public override getOutputs(manager: GraphManager): NodePorts {
		return this.getInputs(manager);
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

export type GroupNodeProps<P extends {}> = { readonly groupId: number } & P;
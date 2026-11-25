import type { CompiledData } from "../compiler";
import type { CompilationContext } from "../context";
import type { PassBufferType, Type } from "../types";
import { Graph } from "./graph";
import { DEFAULT_NODES, GraphInputNode, Node, type NodeType } from "./nodes";
import { PassBufferSampler } from "./nodes/pass-sampler";

/**
 * A `PassGraph` is an isolated wgsl compute shader and can only output PassBuffers.
 * It can only be instantiated in the `WorldGraph` which will serve as the composition
 * of all the passes.
 */
export class PassGraph extends Graph<PassProps> {
	public override get nodeTypes(): NodeType<any, any>[] {
		return [
			...DEFAULT_NODES,
			GraphInputNode,
			PassBufferSampler,
		];
	}

	public override get inputs() {
		return this.props.inputs;
	}

	public override get outputs() {
		return this.props.outputs;
	}

	public setPassInput(name: string, type: Type) {
		this.props.inputs[name] = type;
	}

	public removePassInput(name: string) {
		if (this.props.inputs[name])
			delete this.props.inputs[name];
	}

	public setPassOutput(name: string, type: PassBufferType) {
		this.props.outputs[name] = type;
	}

	public removePassOutput(name: string) {
		if (this.props.outputs[name])
			delete this.props.outputs[name];
	}

	public override async compile(ctx: CompilationContext): Promise<CompiledPass> {
		const visited = new Set<number>();
		const source: string[] = [];
		const dependencies = new Map<PassGraph, Promise<CompiledPass>>();

		const visit = async (node: Node): Promise<void> => {
			if (visited.has(node.id))
				return;

			visited.add(node.id);

			for (const edge of this.edges.filter(edge => edge.target === node.id)) {
				const dependency = this.getNode(edge.source);

				if (!dependency)
					throw new Error(`Missing source node ${edge.source}!`);

				await visit(dependency);
			}

			const compiled = await ctx.resolveNode(node);

			if (compiled.source)
				source.push(compiled.source);

			if (node instanceof PassBufferSampler) {
				const graph = ctx.manager.getGraph(node.props.graphId) as PassGraph;

				if (!dependencies.has(graph))
					dependencies.set(graph, ctx.resolvePass(graph));
			}
		};

		await visit(this.outputNode);

		return {
			source: source.join("\n"),
			inputs: this.inputs,
			outputs: this.outputs,
			dependencies: await Promise.all(dependencies.values())
		};
	}
}

export type PassInputs = Record<string, Type>;
export type PassOutputs = Record<string, PassBufferType>;

export type PassProps = {
	readonly inputs: PassInputs;
	readonly outputs: PassOutputs;
};

export type CompiledPass = CompiledData<{
	readonly inputs: Record<string, Type>;
	readonly outputs: Record<string, PassBufferType>;
	readonly dependencies: CompiledPass[];
}>;

import { assert } from "../../utils";
import type { CompiledData } from "../compiler";
import type { CompilationContext } from "../context";
import { getWGSLType, type PassBufferRef, type PassBufferType, type PrimitiveType, type Texture } from "../types";
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

	public setPassInput(name: string, type: PassInputType) {
		this.props.inputs[name] = type;
	}

	public removePassInput(name: string) {
		if (!this.props.inputs[name])
			return;

		assert(() => !this.nodes.some((node: any) => node instanceof GraphInputNode && node.props.inputName === name), `Cannot remove pass input "${name}" because it is referenced by a GraphInputNode!`);

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
		const nodes: Node[] = [];
		const dependencies = new Map<PassGraph, Promise<CompiledPass>>();
		const bufferInputs = new Map<string, CompiledPassBufferBinding>();
		const bufferBindings = new Map<string, number>();

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

			nodes.push(node);

			if (!(node instanceof PassBufferSampler))
				return;

			const graph = ctx.manager.getGraph(node.props.graphId) as PassGraph;

			if (!dependencies.has(graph))
				dependencies.set(graph, ctx.resolvePass(graph));

			const ref: PassBufferRef = {
				name: "pass-buffer-ref",
				graphId: node.props.graphId,
				bufferKey: node.props.bufferKey
			};

			const key = `${ref.graphId}:${ref.bufferKey}`;

			if (bufferInputs.has(key))
				return;

			const compiled = await dependencies.get(graph)!;
			const output = compiled.outputs[ref.bufferKey];

			if (!output)
				throw new Error(`Missing pass buffer "${ref.bufferKey}" in graph ${ref.graphId}!`);

			const binding = bufferInputs.size;

			bufferInputs.set(key, {
				ref,
				type: output.type,
				binding
			});

			bufferBindings.set(key, binding);
		};

		await visit(this.outputNode);

		const passCtx = ctx.withPassBufferBindings(bufferBindings);
		const source: string[] = [];

		for (const node of nodes) {
			const compiled = await passCtx.resolveNode(node);

			if (compiled.source)
				source.push(compiled.source);
		}

		const outputs: Record<string, CompiledPassBuffer> = {};

		for (const [bufferKey, type] of Object.entries(this.outputs)) {
			outputs[bufferKey] = {
				ref: {
					name: "pass-buffer-ref",
					graphId: this.id,
					bufferKey
				},
				type
			};
		}

		const bufferInputsValues = [...bufferInputs.values()];

		const declarations = bufferInputsValues.map(({ binding, type }) =>
			`@group(0) @binding(${binding})\nvar<storage, read> pass_buffer_${binding}: array<${getWGSLType(type)}>;`
		);

		return {
			source: [...declarations, ...source].join("\n"),
			inputs: this.inputs,
			outputs,
			bufferInputs: bufferInputsValues,
			dependencies: await Promise.all(dependencies.values())
		};
	}
}

export type PassInputType = PrimitiveType | Texture | PassBufferRef;
export type PassInputs = Record<string, PassInputType>;
export type PassOutputs = Record<string, PassBufferType>;

export type PassProps = {
	readonly inputs: PassInputs;
	readonly outputs: PassOutputs;
};

export type CompiledPassBuffer = {
	readonly ref: PassBufferRef;
	readonly type: PassBufferType;
};

export type CompiledPassBufferBinding = {
	readonly ref: PassBufferRef;
	readonly type: PassBufferType;
	readonly binding: number;
};

export type CompiledPass = CompiledData<{
	readonly inputs: PassInputs;
	readonly outputs: Record<string, CompiledPassBuffer>;
	readonly bufferInputs: CompiledPassBufferBinding[];
	readonly dependencies: CompiledPass[];
}>;
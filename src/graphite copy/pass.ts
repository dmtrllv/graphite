import { assert } from "@utils";
import type { CompiledData } from "./compiler/compiler";
import type { CompilationContext } from "./compiler/context";
import { getWGSLType, type PassBufferRef, type PassBufferType, type PrimitiveType, type Texture } from "./types";
import { Graph } from "./graph";
import { DEFAULT_NODES, GraphInputNode, Node } from "./nodes";
import { PassBufferSampler } from "./nodes/pass-sampler";

/**
 * A `PassGraph` is an isolated wgsl compute shader and can only output PassBuffers.
 * It can only be instantiated in the `WorldGraph` which will serve as the composition
 * of all the passes.
 */
export class PassGraph<P extends {} = any> extends Graph<PassProps<P>, any> {
	public override get nodeTypes() {
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
		const dependencies = new Map<PassGraph<any>, Promise<CompiledPass>>();
		const bufferInputs = new Map<string, CompiledPassBuffer>();
		const bufferBindings = new Map<string, number>();

		const addBufferInput = async (ref: PassBufferRef) => {
			const key = `${ref.graphId}:${ref.bufferKey}`;

			if (bufferInputs.has(key))
				return;

			const graph = ctx.manager.getGraph(ref.graphId) as PassGraph<any>;

			if (!dependencies.has(graph))
				dependencies.set(graph, ctx.resolvePass(graph));

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

			if (node instanceof GraphInputNode) {
				const input = this.inputs[node.props.inputName];

				if (input && typeof input === "object" && input.name === "pass-buffer-ref") {
					const ref = ctx.manager.resolvePassInput(this.id, node.props.inputName);
					await addBufferInput(ref);
				}

				return;
			}

			if (!(node instanceof PassBufferSampler))
				return;

			const refEdge = this.edges.find(edge => edge.target === node.id && edge.inputPort === "buffer");

			if (!refEdge)
				throw new Error(`Missing pass buffer connection on node ${node.id}!`);

			const source = this.getNode(refEdge.source);

			if (!source)
				throw new Error(`Missing source node ${refEdge.source}!`);

			const ref = source.getOutputs(ctx.manager)[refEdge.outputPort];

			if (!ref || typeof ref === "string" || ref.name !== "pass-buffer-ref")
				throw new Error(`Invalid pass buffer reference on node ${node.id}!`);

			await addBufferInput(ref);
		};

		await visit(this.outputNode);

		const passCtx = ctx.withPassBufferBindings(bufferBindings);

		const source: string[] = [];

		let graphOutputs: Record<string, string> = {};

		for (const node of nodes) {
			const compiled = await passCtx.resolveNode(node);

			if (compiled.source)
				source.push(compiled.source);

			if (node === this.outputNode) {
				for (const [name, output] of Object.entries(compiled.outputs)) {
					if (typeof output !== "string")
						throw new Error(`Pass output "${name}" in graph ${this.id} must be a value expression!`);

					graphOutputs[name] = output;
				}
			}
		}

		const outputs: Record<string, CompiledPassBuffer> = {};

		for (const [index, [bufferKey, type]] of Object.entries(this.outputs).entries()) {
			const binding = bufferInputs.size + index;

			outputs[bufferKey] = {
				ref: {
					name: "pass-buffer-ref",
					graphId: this.id,
					bufferKey
				},
				type,
				binding
			};
		}

		const outputIndex = "invocation_id.y * CHUNK_SIZE + invocation_id.x";
		const outputWrites = Object.entries(outputs).map(([name]) => {
			const expression = graphOutputs[name];

			if (expression === undefined)
				throw new Error(`Missing expression for pass output "${name}" in graph ${this.id}!`);

			return `pass_output_${name}[${outputIndex}] = ${expression};`;
		});

		const world = ctx.manager.private;

		const configuration = [
			`const WORLD_SIZE: u32 = ${world.props.worldSize}u;`,
			`const CHUNK_SIZE: u32 = ${world.props.chunkSize}u;`,
		];

		const bufferInputsValues = [...bufferInputs.values()];

		const bufferDeclarations = bufferInputsValues.map(({ binding, type }) =>
			`@group(0) @binding(${binding})\nvar<storage, read> pass_buffer_${binding}: array<${getWGSLType(type)}>;`
		);

		const outputDeclarations = Object.entries(this.outputs).map(([bufferKey, type], index) => (
			`@group(0) @binding(${bufferInputs.size + index})\nvar<storage, read_write> pass_output_${bufferKey}: array<${getWGSLType(type)}>;`
		));

		const chunkBinding = bufferInputs.size + Object.keys(this.outputs).length;

		// this must later be dynamic
		const chunkDeclaration = `struct ChunkUniforms {\n\tchunk_origin: vec2<f32>\n};\n@group(0) @binding(${chunkBinding})\nvar<uniform> chunk: ChunkUniforms;`;

		return {
			name: this.name,
			source: [
				...configuration,
				...bufferDeclarations,
				...outputDeclarations,
				chunkDeclaration,
				`@compute @workgroup_size(8, 8, 1)
fn main(@builtin(global_invocation_id) invocation_id: vec3<u32>) {
	if (invocation_id.x >= CHUNK_SIZE || invocation_id.y >= CHUNK_SIZE) {
		return;
	}

	let world_position = vec2<f32>(invocation_id.xy) + chunk.chunk_origin;
	${source.join("\n")}
	${outputWrites.join("\n")}
}`
			].join("\n"),
			inputs: this.inputs,
			outputs,
			bufferInputs: bufferInputsValues,
			dependencies: await Promise.all(dependencies.values()),
			uniform: {
				binding: chunkBinding,
				size: 8,
			}
		};
	}
}

export type PassInputType = PrimitiveType | Texture | PassBufferRef;
export type PassInputs = Record<string, PassInputType>;
export type PassOutputs = Record<string, PassBufferType>;

export type PassProps<P extends {} = any> = P & {
	readonly inputs: PassInputs;
	readonly outputs: PassOutputs;
};

export type CompiledPassBuffer = {
	readonly ref: PassBufferRef;
	readonly type: PassBufferType;
	readonly binding: number;
};

export type CompiledPass = CompiledData<{
	readonly name: string;
	readonly inputs: PassInputs;
	readonly outputs: Record<string, CompiledPassBuffer>;
	readonly bufferInputs: CompiledPassBuffer[];
	readonly dependencies: CompiledPass[];
	readonly uniform: CompiledPassUniform;
}>;

export type CompiledPassUniform = {
	readonly binding: number;
	readonly size: number;
};
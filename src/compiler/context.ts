import type { Compilation } from "./compilation";
import type { PassGraph, Group, SubGraph, Node, GraphManager } from "./graph";
import type { PassBufferRef } from "./types";

export class CompilationContext {
	protected readonly compilation: Compilation;
	public readonly manager: GraphManager;
	private readonly passBufferBindings: Map<string, number>;

	public constructor(compilation: Compilation, manager: GraphManager, passBufferBindings = new Map<string, number>()) {
		this.compilation = compilation;
		this.manager = manager;
		this.passBufferBindings = passBufferBindings;
	}

	public withPassBufferBindings(bindings: Map<string, number>) {
		return new CompilationContext(this.compilation, this.manager, bindings);
	}

	public getPassBufferBinding(ref: PassBufferRef): number {
		const key = `${ref.graphId}:${ref.bufferKey}`;
		const binding = this.passBufferBindings.get(key);

		if (binding === undefined)
			throw new Error(`Missing binding for pass buffer "${ref.bufferKey}" in graph ${ref.graphId}!`);

		return binding;
	}

	public resolvePass(graph: PassGraph) {
		return this.compilation.resolvePass(this, graph);
	}

	public resolveNode(node: Node) {
		return this.compilation.resolveNode(this, node);
	}

	public resolveGroup(group: Group) {
		return this.compilation.resolveGroup(this, group);
	}

	public resolveSubGraph(subGraph: SubGraph) {
		return this.compilation.resolveSubGraph(this, subGraph);
	}

	public async resolveInput(node: Node, inputPort: string): Promise<ResolvedInput | undefined> {
		const graph = this.manager.getGraph(node.graphId);
		const edge = graph.edges.find(edge => edge.target === node.id && edge.inputPort === inputPort);

		if (!edge)
			return undefined;

		const source = graph.getNode(edge.source);

		if (!source)
			throw new Error(`Missing source node ${edge.source}!`);

		const compiled = await this.resolveNode(source);
		const expression = compiled.outputs[edge.outputPort];

		if (expression === undefined)
			throw new Error(`Missing compiled output ${edge.outputPort} on node ${source.id}!`);

		return {
			expression,
			source: compiled.source
		};
	}

	public async resolveInputs(node: Node): Promise<Record<string, ResolvedInput>> {
		const inputs: Record<string, ResolvedInput> = {};

		for (const name of Object.keys(node.getInputs(this.manager))) {
			const input = await this.resolveInput(node, name);

			if (input)
				inputs[name] = input;
		}

		return inputs;
	}
}

export type ResolvedInput = {
	readonly expression: string;
	readonly source: string;
};

import type { CompiledGroup, CompiledPass } from "./compiler";
import type { CompilationContext } from "./context";
import type { CompiledNode, Group, Node, PassGraph } from "./graph";

export class Compilation {
	public readonly nodes = new Map<Node, Promise<CompiledNode>>();
	public readonly groups = new Map<Group, Promise<CompiledGroup>>();
	public readonly passes = new Map<PassGraph, Promise<CompiledPass>>();

	public async resolvePass(ctx: CompilationContext, graph: PassGraph) {
		if (!this.passes.has(graph))
			this.passes.set(graph, Promise.resolve().then(() => this.compilePass(ctx, graph)));
		return this.passes.get(graph)!;
	}

	private async compilePass(_ctx: CompilationContext, _graph: PassGraph): Promise<CompiledPass> {
		throw new Error("todo");
	}

	public async resolveNode(ctx: CompilationContext, node: Node) {
		if (!this.nodes.has(node))
			this.nodes.set(node, Promise.resolve().then(() => this.compileNode(ctx, node)));
		return this.nodes.get(node)!;
	}

	private async compileNode(_ctx: CompilationContext, _node: Node): Promise<CompiledNode> {
		throw new Error("todo");
	}

	public async resolveGroup(ctx: CompilationContext, group: Group) {
		if (!this.groups.has(group))
			this.groups.set(group, Promise.resolve().then(() => this.compileGroup(ctx, group)));
		return this.groups.get(group)!;
	}

	private async compileGroup(_ctx: CompilationContext, _group: Group): Promise<CompiledGroup> {
		throw new Error("todo");
	}
}
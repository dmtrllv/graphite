import type { Group, CompiledGroup } from "../group";
import type { CompiledNode, Node } from "../nodes";
import type { PassGraph, CompiledPass } from "../pass";
import type { SubGraph, CompiledSubGraph } from "../subgraph";
import type { CompilationContext } from "./context";

export class Compilation {
	public readonly nodes = new Map<Node, Promise<CompiledNode>>();
	public readonly groups = new Map<Group, Promise<CompiledGroup>>();
	public readonly passes = new Map<PassGraph, Promise<CompiledPass>>();
	public readonly subGraphs = new Map<SubGraph, Promise<CompiledSubGraph>>();

	public async resolvePass(ctx: CompilationContext, graph: PassGraph) {
		if (!this.passes.has(graph))
			this.passes.set(graph, Promise.resolve().then(() => graph.compile(ctx)));
		return this.passes.get(graph)!;
	}

	public async resolveNode(ctx: CompilationContext, node: Node) {
		if (!this.nodes.has(node))
			this.nodes.set(node, Promise.resolve().then(() => node.compile(ctx)));
		return this.nodes.get(node)!;
	}

	public async resolveGroup(ctx: CompilationContext, group: Group) {
		if (!this.groups.has(group))
			this.groups.set(group, Promise.resolve().then(() => group.compile(ctx)));
		return this.groups.get(group)!;
	}

	public async resolveSubGraph(ctx: CompilationContext, subGraph: SubGraph) {
		if (!this.subGraphs.has(subGraph))
			this.subGraphs.set(subGraph, Promise.resolve().then(() => subGraph.compile(ctx)));
		return this.subGraphs.get(subGraph)!;
	}

	public async resolveJson() {
		return {
			nodes: await Promise.all(Array.from(this.nodes.values())),
			groups: await Promise.all(Array.from(this.groups.values())),
			passes: await Promise.all(Array.from(this.passes.values())),
			subGraphs: await Promise.all(Array.from(this.subGraphs.values())),
		};
	}
}
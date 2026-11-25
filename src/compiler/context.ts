import type { CompiledGroup, CompiledPass } from "./compiler";
import type { CompiledNode, GraphManager, Group, Node, PassGraph } from "./graph";

export class CompileContext {
	public readonly manager: GraphManager;

	private readonly nodes = new Map<Node, Promise<CompiledNode>>();
	private readonly groups = new Map<Group, Promise<CompiledGroup>>();
	private readonly passes = new Map<PassGraph, Promise<CompiledPass>>();

	public constructor(manager: GraphManager) {
		this.manager = manager;
	}

	public async resolvePass(graph: PassGraph) {
		if (!this.passes.has(graph))
			this.passes.set(graph, new Promise(async res => res(await this.compilePass(graph))))!;
		return this.passes.get(graph)!;
	}

	private async compilePass(_graph: PassGraph): Promise<CompiledPass> {
		throw new Error("todo");
	}

	public async resolveNode(node: Node) {
		if (!this.nodes.has(node))
			this.nodes.set(node, new Promise(async res => res(await this.compileNode(node))))!;
		return this.nodes.get(node)!;
	}

	private async compileNode(_node: Node): Promise<CompiledNode> {
		throw new Error("todo");
	}

	public async resolveGroup(group: Group) {
		if (!this.groups.has(group))
			this.groups.set(group, new Promise(async res => res(await this.compileGroup(group))))!;
		return this.groups.get(group)!;
	}

	private async compileGroup(_group: Group): Promise<CompiledGroup> {
		throw new Error("todo");
	}
}
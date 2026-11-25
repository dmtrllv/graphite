import type { Compilation } from "./compilation";
import type { PassGraph, Group, SubGraph, Node } from "./graph";

export class CompilationContext {
	protected readonly compilation: Compilation;

	public constructor(compilation: Compilation) {
		this.compilation = compilation;
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
}
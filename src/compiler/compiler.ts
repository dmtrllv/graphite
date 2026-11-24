import { CompileContext } from "./context";
import type { CompiledGraph, Graph, GraphManager } from "./graph";

export class Compiler {
	public static readonly compile = (manager: GraphManager) => new Compiler(manager).compile(manager.worldGraph);

	private readonly graphs = new Map<Graph, CompiledGraph>();
	private readonly compilingGraphs = new Map<Graph, GraphCompileResolver[]>();

	public readonly manager: GraphManager;

	private constructor(manager: GraphManager) {
		this.manager = manager;
	}

	public async compile(graph: Graph): Promise<CompiledGraph> {
		if (this.compilingGraphs.has(graph))
			return new Promise(res => this.compilingGraphs.get(graph)!.push(res));
		

		if (this.graphs.has(graph))
			return this.graphs.get(graph)!;

		const resolvers: GraphCompileResolver[] = [];
		this.compilingGraphs.set(graph, resolvers);

		const ctx = new CompileContext(this, this.manager);
		const compiledGraph = await graph.compile(ctx);
		this.graphs.set(graph, compiledGraph);
		this.compilingGraphs.delete(graph);
		await Promise.all(resolvers.map(r => r(compiledGraph)));
		return compiledGraph;
	}
}

type GraphCompileResolver = (graph: CompiledGraph) => void;

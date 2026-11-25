import { Compilation } from "./compilation";
import { CompilationContext } from "./context";
import { type GraphManager } from "./graph";

export class Compiler {
	public readonly manager: GraphManager;

	private _compiledWorldGraph: Promise<Compilation> | null = null;

	public constructor(manager: GraphManager) {
		this.manager = manager;
	}

	public async compile(): Promise<Compilation> {
		if (!this._compiledWorldGraph)
			this._compiledWorldGraph = this.compileWorldGraph();
		return this._compiledWorldGraph;
	}

	private async compileWorldGraph(): Promise<Compilation> {
		const compilation = new Compilation();
		const ctx = new CompilationContext(compilation, this.manager);

		await compilation.resolvePass(ctx, this.manager.worldGraph);

		return compilation;
	}
};

export type CompiledData<T extends {} = {}> = T & {
	readonly source: string;
};
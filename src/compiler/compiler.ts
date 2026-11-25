import { Compilation } from "./compilation";
import { CompilationContext } from "./context";
import { type GraphManager } from "./graph";
import type { PassBufferType, Type } from "./types";

export class Compiler {
	public readonly manager: GraphManager;

	private _compiledWorldGraph: Promise<Compilation> | null = null;

	public constructor(manager: GraphManager) {
		this.manager = manager;
	}

	public async compile(): Promise<Compilation> {
		if (!this._compiledWorldGraph)
			this._compiledWorldGraph = new Promise(async res => res(await this.compileWorldGraph()));
		return this._compiledWorldGraph;
	}

	private async compileWorldGraph(): Promise<Compilation> {
		const compilation = new Compilation();
		const ctx = new CompilationContext();

		compilation.resolvePass(ctx, this.manager.worldGraph);

		return compilation;
	}
};

export type CompiledPass = {
	readonly inputs: Record<string, Type>;
	readonly outputs: Record<string, PassBufferType>;
	readonly dependencies: CompiledPass[];
	readonly source: string;
};

export type CompiledNode = {

};

export type CompiledGroup = {
	readonly outputs: Record<string, CompiledNode>;
};
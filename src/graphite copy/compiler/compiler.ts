import { aborted, isAborted, type Abortable } from "@utils";
import { Compilation } from "./compilation";
import { CompilationContext } from "./context";
import type { GraphManager } from "../manager";
import type { CompiledPass } from "../pass";

export class Compiler {
	public readonly manager: GraphManager;

	private _compilationPromise: Promise<Abortable<CompilationResult>> | null = null;
	private _result: CompilationResult | null = null;
	private _compilationId: number = 0;

	public get lastCompilationId() {
		return this._compilationId;
	}

	public constructor(manager: GraphManager) {
		this.manager = manager;
	}

	public async compile(overwrite: boolean = false): Promise<Abortable<CompilationResult>> {
		if (!overwrite) {
			if (this._result)
				return this._result;
			if (this._compilationPromise)
				return this._compilationPromise;
		}

		this._result = null;

		const compilationId = ++this._compilationId;
		const promise = this.compileWorldGraph(compilationId);

		this._compilationPromise = promise;

		try {
			const result = await promise;

			if (compilationId !== this._compilationId)
				return aborted()

			if (!isAborted(result))
				this._result = result;

			return result;
		} finally {
			if (this._compilationPromise === promise)
				this._compilationPromise = null;
		}
	}

	private async compileWorldGraph(compilationId: number): Promise<Abortable<CompilationResult>> {
		const compilation = new Compilation();
		const ctx = new CompilationContext(compilation, this.manager);
		const worldPass = await compilation.resolvePass(ctx, this.manager.worldGraph);
		if (compilationId !== this._compilationId)
			return aborted();
		return { 
			compilationId, 
			compilation, 
			worldPass
		};
	}
};

export type CompilationResult = {
	readonly compilationId: number;
	readonly compilation: Compilation;
	readonly worldPass: CompiledPass
};

export type CompiledData<T extends {} = any> = T & {
	readonly source: string;
};
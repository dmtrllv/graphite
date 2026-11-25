import { PassGraph, type GraphManager } from "./graph";
import type { PassBufferType, Type } from "./types";

export class Compiler {
	public readonly manager: GraphManager;

	private _compiledWorldGraph: Promise<CompiledPass> | null = null;

	public constructor(manager: GraphManager) {
		this.manager = manager;
	}

	public async compile(): Promise<CompiledPass> {
		if (!this._compiledWorldGraph)
			this._compiledWorldGraph = new Promise(async res => res(await this.compileWorldGraph()));
		return this._compiledWorldGraph;
	}

	private async compileWorldGraph(): Promise<CompiledPass> {
		// 
		const worldOutputs = this.manager.worldGraph.outputs;

		const passes = this.manager.getGraphs(PassGraph);
		console.log(worldOutputs, passes);

		return {
			
		}
	}

	private async compilePass() {

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
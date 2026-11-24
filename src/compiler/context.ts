import type { Compiler } from "./compiler";
import type { GraphManager } from "./graph";

export class CompileContext {
	public readonly compiler: Compiler;
	public readonly manager: GraphManager;
	
	public constructor(compiler: Compiler, manager: GraphManager) {
		this.compiler = compiler;
		this.manager = manager;
	}
}
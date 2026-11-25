import type { CompilationContext } from "../../context";
import { Node, type CompiledNode } from "./node";

export class GraphInputNode extends Node<{ graphId: number; inputName: string; }> {
	public override compile(_ctx: CompilationContext): CompiledNode {
		throw new Error("Method not implemented.");
	}
	
}

export class GraphOutputNode extends Node<{ graphId: number }> {
	public override compile(_ctx: CompilationContext): CompiledNode {
		throw new Error("Method not implemented.");
	}
	
}

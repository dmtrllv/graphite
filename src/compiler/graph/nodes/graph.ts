import type { CompileContext } from "../../context";
import { Node, type CompiledNode } from "./node";

export class GraphOutputNode extends Node<{ graphId: number }> {
	public override compile(ctx: CompileContext, inputs: Record<string, string>): CompiledNode | Promise<CompiledNode> {
		throw new Error("Method not implemented.");
	}
}

export class GraphInputNode extends Node<{ graphId: number; inputName: string; }> {
	public override compile(ctx: CompileContext, inputs: Record<string, string>): CompiledNode | Promise<CompiledNode> {
		throw new Error("Method not implemented.");
	}
}

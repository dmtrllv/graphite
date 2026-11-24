import type { CompileContext } from "../../context";
import { Node } from "./node";

export class GraphOutputNode extends Node<{ graphId: number }> {
	public override compile(ctx: CompileContext, inputs: Record<string, string>): string {
		throw new Error("Method not implemented.");
	}
}

export class GraphInputNode extends Node<{ graphId: number; inputName: string; }> {
	public override compile(ctx: CompileContext, inputs: Record<string, string>): string {
		throw new Error("Method not implemented.");
	}
}
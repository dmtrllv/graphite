import type { CompilationContext } from "../../context";
import { ValueType } from "../../types";
import { Node, type CompiledNode } from "./node";

export class ValueNode extends Node<{ name?: string, value: number }> {
	public override getOutputs() {
		return {
			value: ValueType
		};
	}

	public override compile(_ctx: CompilationContext): CompiledNode {
		throw new Error("Method not implemented.");
	}
};

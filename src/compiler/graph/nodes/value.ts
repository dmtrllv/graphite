import type { CompileContext } from "../../context";
import { ValueType } from "../../types";
import { Node } from "./node";

export class ValueNode extends Node<{ name?: string, value: number }> {
	public override getOutputs() {
		return {
			value: ValueType
		};
	}

	public override compile(ctx: CompileContext, inputs: Record<string, string>): string {
		throw new Error("Method not implemented.");
	}
};

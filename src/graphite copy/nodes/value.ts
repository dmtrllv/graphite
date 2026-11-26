import { ValueType } from "../types";
import { Node, type CompiledNode } from "./node";

export class ValueNode extends Node<{ name?: string, value: number }> {
	public override getOutputs() {
		return {
			value: ValueType
		};
	}

	public override compile(): CompiledNode {
		const value = String(this.props.value);
		const expression = Number.isInteger(this.props.value) ? `${value}.0` : value;

		return {
			source: "",
			outputs: {
				value: expression
			}
		};
	}
};

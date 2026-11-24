import { ValueType } from "../../types";
import { Node } from "./node";

export class ValueNode extends Node<{ name?: string, value: number }> {
	public override getOutputs() {
		return {
			value: ValueType
		};
	}

	public override compile(): string {
		return `${this.props.value}.0`;
	}
};

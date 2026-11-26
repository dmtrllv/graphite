import { Node } from "../node";
import { ValueType } from "../types";

export class ValueNode extends Node<ValueNode, { value: number }> {
	public override get outputTypes() { 
		return {
			value: ValueType
		};
	}
}
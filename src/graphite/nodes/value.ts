import { Node } from "../node";
import { ValueType } from "../types";

export const ValueCategory = Node.createCategory("Value");

@Node.register(ValueCategory, "f32")
export class ValueNode extends Node<{ value: number }> {
	public override get outputTypes() { 
		return {
			value: ValueType
		};
	}
	
	public override get defaultState() {
		return {
			value: 0
		};
	}
}
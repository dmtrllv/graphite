import { Node } from "../node";
import { ValueType } from "../types";

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
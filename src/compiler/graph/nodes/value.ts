import { ValueType } from "../../types";
import { Node } from "./node";

export class ValueNode extends Node {
	public value: number;

	public override get outputs() {
		return {
			value: ValueType
		};
	}

	public constructor(id: number, value: number) {
		super(id);
		this.value = value;
	}
};

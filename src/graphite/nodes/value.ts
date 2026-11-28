import { Node } from "../node";
import { ValueType, Vec4, Vector4 } from "../types";

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

@Node.register(ValueCategory, "Vector Split")
export class VectorSplit extends Node<{ vector: Vector4 }> {
	public override get inputTypes() {
		return {
			vector: Vec4
		}
	}

	public override get outputTypes() {
		return {
			x: ValueType,
			y: ValueType,
			z: ValueType,
			w: ValueType,
		}
	}

	public override get defaultState() {
		return {
			vector: new Vector4()
		}
	}
}

@Node.register(ValueCategory, "Vector Combine")
export class VectorCombine extends Node<{ x: number, y: number, z: number, w: number }> {
	public override get inputTypes() {
		return {
			x: ValueType,
			y: ValueType,
			z: ValueType,
			w: ValueType,
		}
	}

	public override get outputTypes() {
		return {
			vector: Vec4
		}
	}

	public override get defaultState() {
		return {
			x: 0,
			y: 0,
			z: 0,
			w: 0,
		}
	}
}
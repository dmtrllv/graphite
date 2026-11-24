import { createEnum, isVariant, type EnumType } from "@utils";
import { Node } from "./node";
import { ValueType } from "../../types";

export const UnaryOp = createEnum(
	"not",
	"negate",
	"inverse"
);

export const BinaryOp = createEnum(
	"add",
	"sub"
);

export const TernaryOp = createEnum(
	"select",
	"mix",
	"clamp",
	"smoothStep",
);

type MathOpTypes = typeof BinaryOp | typeof UnaryOp | typeof TernaryOp;

export type MathOp = EnumType<typeof BinaryOp | typeof UnaryOp | typeof TernaryOp>;

abstract class AbstractMathNode<T extends MathOpTypes> extends Node<{ op: EnumType<T> }> {
	public abstract get opType(): T;

	public override getOutputs() {
		return {
			value: ValueType
		};
	}

	protected override deserializeProps(props: { op: EnumType<T>; }): { op: EnumType<T>; } {
		if (!isVariant(this.opType, props.op)) {
			const op = this.opType[props.op];
			console.log("deserialized props", props, isVariant(this.opType, props.op));
			if (!op)
				throw new Error("Could not parse op enum variant");
			return { op };
		}
		return props;
	}
}

export class UnaryOpNode extends AbstractMathNode<typeof UnaryOp> {
	public override get opType() {
		return UnaryOp;
	}

	public override getInputs() {
		return {
			a: ValueType,
		};
	}
}

export class BinaryOpNode extends AbstractMathNode<typeof BinaryOp> {
	public override get opType() {
		return BinaryOp;
	}

	public override getInputs() {
		return {
			a: ValueType,
			b: ValueType,
		};
	}
}

export class TernaryOpNode extends AbstractMathNode<typeof TernaryOp> {
	public override get opType() {
		return TernaryOp;
	}

	public override getInputs() {
		return {
			a: ValueType,
			b: ValueType,
			c: ValueType,
		};
	}
}

export const MathNodes = [
	UnaryOpNode,
	BinaryOpNode,
	TernaryOpNode,
] as const;

export type MathNode = (typeof MathNodes[number]);
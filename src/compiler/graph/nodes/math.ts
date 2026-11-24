import { createEnum, type EnumType } from "@utils";
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

export type MathOp = EnumType<typeof BinaryOp | typeof UnaryOp | typeof TernaryOp>;

abstract class AbstractMathNode<T extends MathOp> extends Node<{ op: T }> {
	public override getOutputs() {
		return {
			value: ValueType
		};
	}
}

export class UnaryOpNode extends AbstractMathNode<EnumType<typeof UnaryOp>> {
	public override getInputs() {
		return {
			a: ValueType,
		};
	}
}

export class BinaryOpNode extends AbstractMathNode<EnumType<typeof BinaryOp>> {
	public override getInputs() {
		return {
			a: ValueType,
			b: ValueType,
		};
	}
}

export class TernaryOpNode extends AbstractMathNode<EnumType<typeof TernaryOp>> {
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
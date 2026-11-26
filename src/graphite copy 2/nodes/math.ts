import { createEnum, type EnumType } from "../../utils";
import { Node } from "../node";
import { ValueType } from "../types";

export const BinOp = createEnum(
	"add",
	"sub",
	"mul",
	"div"
);

export type BinOp = EnumType<typeof BinOp>;

export class BinOpNode extends Node<BinOpNode, BinOpNodeProps> {
	public override get inputTypes() {
		return {
			a: ValueType,
			b: ValueType,
		};
	}

	public override get outputTypes() { 
		return {
			value: ValueType
		};
	}

	public override get defaultProps() {
		return {
			a: 0,
			b: 0,
		}
	}
}

export type BinOpNodeProps = {
	a: number;
	b: number;
	op: BinOp;
};
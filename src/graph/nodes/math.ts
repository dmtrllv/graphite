import { F32, Scalar, Vec4, type Vector } from "../types";
import { GraphNode, input, NodeOption, NodeOptionProp, option } from "./node";

export const MathOps = [
	"add",
	"subtract",
	"multiplty",
	"divide",
] as const;

@GraphNode.register("Math")
export class MathNode extends GraphNode {
	@input
	accessor a: Scalar = new F32(0);

	@input
	accessor b: Scalar = new F32(0);

	@option()
	accessor op = new NodeOption(MathOps);
}


export type MathOp = (typeof MathOps)[number];


export const VectorMathOps = [
	"add",
	"subtract",
	"multiplty",
	"divide",
] as const;

@GraphNode.register("Vector Math")
export class VectorMathNode extends GraphNode {
	@input
	accessor a: Vector = new Vec4();

	@input
	accessor b: Vector = new Vec4();

	@option()
	accessor op = new NodeOption(VectorMathOps);
}

export type VectorMathOp = (typeof VectorMathOps)[number];

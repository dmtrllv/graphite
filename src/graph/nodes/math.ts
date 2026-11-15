import { observable } from "../../reactive";
import { F32, Scalar, Vec4, type Vector } from "../types";
import { GraphNode, input } from "./node";

@GraphNode.register("Math")
export class MathNode extends GraphNode {
	@input
	accessor a: Scalar = new F32(0);

	@input
	accessor b: Scalar = new F32(0);

	@observable
	accessor op: MathOp = "add";
}

export const MathOps = [
	"add",
	"subtract",
	"multiplty",
	"divide",
] as const;

export type MathOp = (typeof MathOps)[number];

@GraphNode.register("Vector Math")
export class VectorMathNode extends GraphNode {
	@input
	accessor a: Vector = new Vec4();

	@input
	accessor b: Vector = new Vec4();
}
import { F32, Scalar, Vec4, type Vector } from "../types";
import { GraphNode, input, output, option, SelectOption, GraphNodeCategory } from "./node";

export const MathOps = [
	"add",
	"subtract",
	"multiply",
	"divide",
	"negate"
] as const;

@GraphNode.register(GraphNodeCategory.Math, "Math")
export class MathNode extends GraphNode {
	@input()
	accessor a: Scalar = new F32(0);

	@input()
	accessor b: Scalar = new F32(0);

	@output()
	accessor result: Scalar = new F32(0);

	@option({
		add: { inputs: ["a", "b"], outputs: ["result"] },
		subtract: { inputs: ["a", "b"], outputs: ["result"] },
		multiply: { inputs: ["a", "b"], outputs: ["result"] },
		divide: { inputs: ["a", "b"], outputs: ["result"] },
		negate: { inputs: ["a"], outputs: ["result"] }
	})
	accessor op = new SelectOption(MathOps);
}

export type MathOp = (typeof MathOps)[number];

export const VectorMathOps = [
	"add",
	"subtract",
	"multiply",
	"divide"
] as const;

@GraphNode.register(GraphNodeCategory.Math,"Vector Math")
export class VectorMathNode extends GraphNode {
	@input()
	accessor a: Vector = new Vec4();

	@input()
	accessor b: Vector = new Vec4();

	@output()
	accessor result: Vector = new Vec4();

	@option({
		add: { inputs: ["a", "b"], outputs: ["result"] },
		subtract: { inputs: ["a", "b"], outputs: ["result"] },
		multiply: { inputs: ["a", "b"], outputs: ["result"] },
		divide: { inputs: ["a", "b"], outputs: ["result"] }
	})
	accessor op = new SelectOption(VectorMathOps);
}

export type VectorMathOp = (typeof VectorMathOps)[number];
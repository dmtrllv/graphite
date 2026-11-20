import { F32, Scalar, Vec4, Vector } from "../types";
import { GraphNode, input, output, option, SelectOption, GraphNodeCategory } from "./node";
import { serializable } from "../../serializable";

export const MathOps = [
	"add",
	"subtract",
	"multiply",
	"divide",
	"modulo",
	"negate",
	"abs",
	"sign",
	"floor",
	"ceil",
	"round",
	"fract",
	"equal",
	"not equal",
	"less",
	"greater",
	"less or equal",
	"greater or equal",
	"and",
	"or",
	"not",
	"min",
	"max",
	"clamp",
	"lerp",
	"smoothstep",
	"sin",
	"cos",
	"tan",
	"atan2"
] as const;

@GraphNode.register(GraphNodeCategory.Math, "Math")
export class MathNode extends GraphNode {
	@input()
	@serializable(Scalar)
	accessor a: Scalar = new F32(0);

	@input()
	@serializable(Scalar)
	accessor b: Scalar = new F32(0);

	@output()
	@serializable(Scalar)
	accessor result: Scalar = new F32(0);

	@option({
		add: { inputs: ["a", "b"], outputs: ["result"] },
		subtract: { inputs: ["a", "b"], outputs: ["result"] },
		multiply: { inputs: ["a", "b"], outputs: ["result"] },
		divide: { inputs: ["a", "b"], outputs: ["result"] },
		negate: { inputs: ["a"], outputs: ["result"] }
	})
	@serializable(SelectOption)
	accessor op = new SelectOption(MathOps);
}

export type MathOp = (typeof MathOps)[number];

export const VectorMathOps = [
	"add",
	"subtract",
	"multiply",
	"divide",
	"dot",
	"cross",
	"length",
	"normalize",
	"distance",
] as const;

@GraphNode.register(GraphNodeCategory.Math, "Vector Math")
export class VectorMathNode extends GraphNode {
	@input()
	@serializable(Vector)
	accessor a: Vector = new Vec4();

	@input()
	@serializable(Vector)
	accessor b: Vector = new Vec4();

	@output()
	@serializable(Vector)
	accessor result: Vector = new Vec4();

	@option({
		add: { inputs: ["a", "b"], outputs: ["result"] },
		subtract: { inputs: ["a", "b"], outputs: ["result"] },
		multiply: { inputs: ["a", "b"], outputs: ["result"] },
		divide: { inputs: ["a", "b"], outputs: ["result"] }
	})
	@serializable(SelectOption)
	accessor op = new SelectOption(VectorMathOps);
}

export type VectorMathOp = (typeof VectorMathOps)[number];

import { Bool, F32, Scalar, Type, Vec4, Vector } from "../types";
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

const boolOutput = { result: () => new Bool(false) };

@GraphNode.register(GraphNodeCategory.Math, "Math")
export class MathNode extends GraphNode {
	@input()
	@serializable(Scalar)
	accessor a: Scalar = new F32(0);

	@input()
	@serializable(Scalar)
	accessor b: Scalar = new F32(0);

	@input()
	@serializable(Scalar)
	accessor c: Scalar = new F32(0);

	@output()
	@serializable(Type)
	accessor result: Type = new F32(0);

	@option({
		add: { inputs: ["a", "b"], outputs: ["result"] },
		subtract: { inputs: ["a", "b"], outputs: ["result"] },
		multiply: { inputs: ["a", "b"], outputs: ["result"] },
		divide: { inputs: ["a", "b"], outputs: ["result"] },
		modulo: { inputs: ["a", "b"], outputs: ["result"] },
		negate: { inputs: ["a"], outputs: ["result"] },
		abs: { inputs: ["a"], outputs: ["result"] },
		sign: { inputs: ["a"], outputs: ["result"] },
		floor: { inputs: ["a"], outputs: ["result"] },
		ceil: { inputs: ["a"], outputs: ["result"] },
		round: { inputs: ["a"], outputs: ["result"] },
		fract: { inputs: ["a"], outputs: ["result"] },
		equal: { inputs: ["a", "b"], outputs: ["result"], outputTypes: boolOutput },
		"not equal": { inputs: ["a", "b"], outputs: ["result"], outputTypes: boolOutput },
		less: { inputs: ["a", "b"], outputs: ["result"], outputTypes: boolOutput },
		greater: { inputs: ["a", "b"], outputs: ["result"], outputTypes: boolOutput },
		"less or equal": { inputs: ["a", "b"], outputs: ["result"], outputTypes: boolOutput },
		"greater or equal": { inputs: ["a", "b"], outputs: ["result"], outputTypes: boolOutput },
		and: { inputs: ["a", "b"], outputs: ["result"], outputTypes: boolOutput },
		or: { inputs: ["a", "b"], outputs: ["result"], outputTypes: boolOutput },
		not: { inputs: ["a"], outputs: ["result"], outputTypes: boolOutput },
		min: { inputs: ["a", "b"], outputs: ["result"] },
		max: { inputs: ["a", "b"], outputs: ["result"] },
		clamp: { inputs: ["a", "b", "c"], outputs: ["result"] },
		lerp: { inputs: ["a", "b", "c"], outputs: ["result"] },
		smoothstep: { inputs: ["a", "b", "c"], outputs: ["result"] },
		sin: { inputs: ["a"], outputs: ["result"] },
		cos: { inputs: ["a"], outputs: ["result"] },
		tan: { inputs: ["a"], outputs: ["result"] },
		atan2: { inputs: ["a", "b"], outputs: ["result"] }
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
	"distance"
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
	@serializable(Type)
	accessor result: Type = new Vec4();

	@option({
		add: { inputs: ["a", "b"], outputs: ["result"] },
		subtract: { inputs: ["a", "b"], outputs: ["result"] },
		multiply: { inputs: ["a", "b"], outputs: ["result"] },
		divide: { inputs: ["a", "b"], outputs: ["result"] },
		dot: { inputs: ["a", "b"], outputs: ["result"], outputTypes: { result: () => new F32(0) } },
		cross: { inputs: ["a", "b"], outputs: ["result"] },
		length: { inputs: ["a"], outputs: ["result"], outputTypes: { result: () => new F32(0) } },
		normalize: { inputs: ["a"], outputs: ["result"] },
		distance: { inputs: ["a", "b"], outputs: ["result"], outputTypes: { result: () => new F32(0) } }
	})
	@serializable(SelectOption)
	accessor op = new SelectOption(VectorMathOps);
}

export type VectorMathOp = (typeof VectorMathOps)[number];

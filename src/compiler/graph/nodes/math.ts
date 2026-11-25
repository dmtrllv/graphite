import { createEnum, isVariant, type EnumType } from "@utils";
import { Node, type CompiledNode } from "./node";
import { ValueType } from "../../types";
import type { CompilationContext } from "../../context";

export const UnaryOp = createEnum(
	"not",
	"negate",
	"inverse",
	"abs",
	"sign",
	"floor",
	"ceil",
	"round",
	"trunc",
	"fract",
	"sqrt",
	"inverseSqrt",
	"exp",
	"exp2",
	"log",
	"log2",
	"sin",
	"cos",
	"tan",
	"asin",
	"acos",
	"atan",
	"degrees",
	"radians"
);

export const BinaryOp = createEnum(
	"add",
	"sub",
	"mul",
	"div",
	"mod",
	"pow",
	"min",
	"max",
	"atan2",
	"step"
);

export const TernaryOp = createEnum(
	"select",
	"mix",
	"clamp",
	"smoothStep"
);

type MathOpTypes = typeof BinaryOp | typeof UnaryOp | typeof TernaryOp;

export type MathOp = EnumType<typeof BinaryOp | typeof UnaryOp | typeof TernaryOp>;

const resolveInput = async (ctx: CompilationContext, node: Node, name: string): Promise<string> => {
	const input = await ctx.resolveInput(node, name);

	if (!input)
		throw new Error(`Missing input "${name}" on node ${node.id}!`);

	return input.expression;
};

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

	public override async compile(ctx: CompilationContext): Promise<CompiledNode> {
		const a = await resolveInput(ctx, this, "a");
		const op = String(this.props.op);

		const expressions: Record<string, string> = {
			not: `select(1.0, 0.0, ${a} != 0.0)`,
			negate: `(-${a})`,
			inverse: `(1.0 / ${a})`,
			abs: `abs(${a})`,
			sign: `sign(${a})`,
			floor: `floor(${a})`,
			ceil: `ceil(${a})`,
			round: `round(${a})`,
			trunc: `trunc(${a})`,
			fract: `fract(${a})`,
			sqrt: `sqrt(${a})`,
			inverseSqrt: `inverseSqrt(${a})`,
			exp: `exp(${a})`,
			exp2: `exp2(${a})`,
			log: `log(${a})`,
			log2: `log2(${a})`,
			sin: `sin(${a})`,
			cos: `cos(${a})`,
			tan: `tan(${a})`,
			asin: `asin(${a})`,
			acos: `acos(${a})`,
			atan: `atan(${a})`,
			degrees: `degrees(${a})`,
			radians: `radians(${a})`
		};

		const expression = expressions[op];

		if (!expression)
			throw new Error(`Unsupported unary operation "${op}"!`);

		return {
			source: "",
			outputs: {
				value: expression
			}
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

	public override async compile(ctx: CompilationContext): Promise<CompiledNode> {
		const a = await resolveInput(ctx, this, "a");
		const b = await resolveInput(ctx, this, "b");
		const op = String(this.props.op);

		const expressions: Record<string, string> = {
			add: `(${a} + ${b})`,
			sub: `(${a} - ${b})`,
			mul: `(${a} * ${b})`,
			div: `(${a} / ${b})`,
			mod: `(${a} - ${b} * floor(${a} / ${b}))`,
			pow: `pow(${a}, ${b})`,
			min: `min(${a}, ${b})`,
			max: `max(${a}, ${b})`,
			atan2: `atan2(${a}, ${b})`,
			step: `step(${a}, ${b})`
		};

		const expression = expressions[op];

		if (!expression)
			throw new Error(`Unsupported binary operation "${op}"!`);

		return {
			source: "",
			outputs: {
				value: expression
			}
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

	public override async compile(ctx: CompilationContext): Promise<CompiledNode> {
		const a = await resolveInput(ctx, this, "a");
		const b = await resolveInput(ctx, this, "b");
		const c = await resolveInput(ctx, this, "c");
		const op = String(this.props.op);

		const expressions: Record<string, string> = {
			select: `select(${a}, ${b}, ${c} != 0.0)`,
			mix: `mix(${a}, ${b}, ${c})`,
			clamp: `clamp(${a}, ${b}, ${c})`,
			smoothStep: `smoothstep(${a}, ${b}, ${c})`
		};

		const expression = expressions[op];

		if (!expression)
			throw new Error(`Unsupported ternary operation "${op}"!`);

		return {
			source: "",
			outputs: {
				value: expression
			}
		};
	}
}

export const MathNodes = [
	UnaryOpNode,
	BinaryOpNode,
	TernaryOpNode,
] as const;

export type MathNode = (typeof MathNodes[number]);

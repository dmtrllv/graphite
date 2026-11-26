import { Vec3, ValueType, Vec2, Vec4 } from "../types";
import type { CompilationContext } from "../compiler/context";
import { Node, type CompiledNode } from "./node";
export class Vector2Node extends Node<{}> {
	public override getInputs() {
		return {
			x: ValueType,
			y: ValueType,
		};
	}

	public override getOutputs() {
		return {
			value: Vec2
		};
	}

	public override async compile(ctx: CompilationContext): Promise<CompiledNode> {
		const inputs = await Promise.all([
			ctx.resolveInput(this, "x"),
			ctx.resolveInput(this, "y"),
		]);

		if (inputs.some(input => !input))
			throw new Error(`Missing input on Vector3Node ${this.id}!`);

		return {
			source: "",
			outputs: {
				value: `vec2<f32>(${inputs.map(input => input!.expression).join(", ")})`
			}
		};
	}
}

export class Vector3Node extends Node<{}> {
	public override getInputs() {
		return {
			x: ValueType,
			y: ValueType,
			z: ValueType,
		};
	}

	public override getOutputs() {
		return {
			value: Vec3
		};
	}

	public override async compile(ctx: CompilationContext): Promise<CompiledNode> {
		const inputs = await Promise.all([
			ctx.resolveInput(this, "x"),
			ctx.resolveInput(this, "y"),
			ctx.resolveInput(this, "z"),
		]);

		if (inputs.some(input => !input))
			throw new Error(`Missing input on Vector3Node ${this.id}!`);

		return {
			source: "",
			outputs: {
				value: `vec3<f32>(${inputs.map(input => input!.expression).join(", ")})`
			}
		};
	}
}

export class Vector4Node extends Node<{}> {
	public override getInputs() {
		return {
			x: ValueType,
			y: ValueType,
			z: ValueType,
			w: ValueType,
		};
	}

	public override getOutputs() {
		return {
			value: Vec4
		};
	}

	public override async compile(ctx: CompilationContext): Promise<CompiledNode> {
		const inputs = await Promise.all([
			ctx.resolveInput(this, "x"),
			ctx.resolveInput(this, "y"),
			ctx.resolveInput(this, "z"),
			ctx.resolveInput(this, "w"),
		]);

		if (inputs.some(input => !input))
			throw new Error(`Missing input on Vector3Node ${this.id}!`);

		return {
			source: "",
			outputs: {
				value: `vec4<f32>(${inputs.map(input => input!.expression).join(", ")})`
			}
		};
	}
}

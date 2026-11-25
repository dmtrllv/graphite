import { Vec3, ValueType } from "../../types";
import type { CompilationContext } from "../../context";
import { Node, type CompiledNode } from "./node";

export class Vector3Node extends Node<{}> {
	public override getInputs() {
		return {
			x: ValueType,
			y: ValueType,
			z: ValueType
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
			ctx.resolveInput(this, "z")
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

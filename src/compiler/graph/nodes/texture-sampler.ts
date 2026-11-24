import type { CompileContext } from "../../context";
import { Texture, Vec2, Vec4 } from "../../types";
import type { GraphManager } from "../graph-manager";
import { Node, type CompiledNode, type NodePorts } from "./node";

export class TextureSampler extends Node {
	public override getInputs(_graph: GraphManager) {
		return {
			texture: Texture,
			uv: Vec2
		};
	}

	public override getOutputs(_graph: GraphManager): NodePorts {
		return {
			color: Vec4
		};
	}

	public override compile(ctx: CompileContext, inputs: Record<string, string>): CompiledNode | Promise<CompiledNode> {
		throw new Error("Method not implemented.");
	}
}
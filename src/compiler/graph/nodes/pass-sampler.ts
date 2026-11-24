import type { CompileContext } from "../../context";
import { Vec2 } from "../../types";
import type { GraphManager } from "../graph-manager";
import { Node, type CompiledNode } from "./node";

export class PassBufferSampler extends Node {
	public override getInputs(_graph: GraphManager) {
		return {
			buffer: Passbuffer,
			position: Vec2
		};
	}

	public override getOutputs(_graph: GraphManager) {
		return {
			value: this.getInputs().buffer.type
		}
	}

	public override compile(ctx: CompileContext, inputs: Record<string, string>): CompiledNode | Promise<CompiledNode> {
		throw new Error("Method not implemented.");
	}
}
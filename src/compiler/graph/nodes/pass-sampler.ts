import { Vec2 } from "../../types";
import type { GraphManager } from "../graph-manager";
import { Node } from "./node";

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
}
import type { PassBufferType, Type } from "../types";
import { Graph } from "./graph";
import { DEFAULT_NODES, GraphInputNode, type NodeType } from "./nodes";

export class PassGraph extends Graph {
	public override get nodeTypes(): NodeType<any, any>[] {
		return [
			...DEFAULT_NODES,
			GraphInputNode,
		];
	}

	private passInputs: PassInputs = {};
	private passOutputs: PassOutputs = {};

	public override get inputs() {
		return this.passInputs;
	}

	public override get outputs() {
		return this.passOutputs;
	}

	public setPassInput(name: string, type: Type) {
		this.passInputs[name] = type;
	}

	public removePassInput(name: string) {
		if (this.passInputs[name])
			delete this.passInputs[name];
	}

	public setPassOutput(name: string, type: PassBufferType) {
		this.passOutputs[name] = type;
	}

	public removePassOutput(name: string) {
		if (this.passOutputs[name])
			delete this.passOutputs[name];
	}
}

export type PassInputs = Record<string, Type>;
export type PassOutputs = Record<string, PassBufferType>;
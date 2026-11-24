import type { PassBufferType, Type } from "../types";
import { Graph } from "./graph";
import { DEFAULT_NODES, GraphInputNode, type NodeType } from "./nodes";
import { PassBufferSampler } from "./nodes/pass-sampler";

/**
 * A `PassGraph` is an isolated wgsl compute shader and can only output PassBuffers.
 * It can only be instantiated in the `WorldGraph` which will serve as the composition
 * of all the passes.
 */
export class PassGraph extends Graph {
	public override get nodeTypes(): NodeType<any, any>[] {
		return [
			...DEFAULT_NODES,
			GraphInputNode,
			PassBufferSampler,
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
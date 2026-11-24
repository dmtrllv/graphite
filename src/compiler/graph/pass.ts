import type { PassBufferType, Type } from "../types";
import { Graph } from "./graph";
import { DEFAULT_NODES, GraphInputNode, type NodeType } from "./nodes";
import { PassBufferSampler } from "./nodes/pass-sampler";

/**
 * A `PassGraph` is an isolated wgsl compute shader and can only output PassBuffers.
 * It can only be instantiated in the `WorldGraph` which will serve as the composition
 * of all the passes.
 */
export class PassGraph extends Graph<PassProps> {
	public override get nodeTypes(): NodeType<any, any>[] {
		return [
			...DEFAULT_NODES,
			GraphInputNode,
			PassBufferSampler,
		];
	}

	public override get inputs() {
		return this.props.inputs;
	}

	public override get outputs() {
		return this.props.outputs;
	}

	public setPassInput(name: string, type: Type) {
		this.props.inputs[name] = type;
	}

	public removePassInput(name: string) {
		if (this.props.inputs[name])
			delete this.props.inputs[name];
	}

	public setPassOutput(name: string, type: PassBufferType) {
		this.props.outputs[name] = type;
	}

	public removePassOutput(name: string) {
		if (this.props.outputs[name])
			delete this.props.outputs[name];
	}
}

export type PassInputs = Record<string, Type>;
export type PassOutputs = Record<string, PassBufferType>;

export type PassProps =  {
	readonly inputs: PassInputs;
	readonly outputs: PassOutputs;
};
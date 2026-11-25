import { ValueType, type PassBufferType, type Type } from "../types";
import { DEFAULT_NODES } from "./nodes";
import { PassNode } from "./nodes/pass";
import { PassBufferSampler } from "./nodes/pass-sampler";
import { PassGraph, type PassOutputs } from "./pass";

export class WorldGraph extends PassGraph {
	public override get nodeTypes() {
		return [
			...DEFAULT_NODES,
			PassNode,
			PassBufferSampler,
		];
	}

	public override get outputs() {
		return {
			elevation: ValueType,
			...this.props.outputs,
		};
	}

	public setOutput(name: string, type: PassBufferType) {
		this.props.outputs[name] = type;
	}

	public removeOutput(name: string) {
		if (this.props.outputs[name])
			delete this.props.outputs[name];
	}

	public override setPassInput(_name: string, _type: Type) {}

	public override removePassInput(_name: string) {}
}

export type WorldGraphProps = {
	readonly outputs: PassOutputs;
};
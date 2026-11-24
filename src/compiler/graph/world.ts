import { ValueType, type PassBufferType } from "../types";
import { Graph } from "./graph";
import { DEFAULT_NODES } from "./nodes";
import { PassNode } from "./nodes/pass";
import { PassBufferSampler } from "./nodes/pass-sampler";
import type { PassOutputs } from "./pass";

export class WorldGraph extends Graph {
	public override get nodeTypes() {
		return [
			...DEFAULT_NODES,
			PassNode,
			PassBufferSampler,
		];
	}

	private worldOutputs: PassOutputs = {};

	public override get outputs() {
		return {
			elevation: ValueType,
			...this.worldOutputs,
		};
	}

	public setOutput(name: string, type: PassBufferType) {
		this.worldOutputs[name] = type;
	}

	public removeOutput(name: string) {
		if (this.worldOutputs[name])
			delete this.worldOutputs[name];
	}
}
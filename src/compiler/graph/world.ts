import { ValueType, type Type } from "../types";
import { DEFAULT_NODES } from "./nodes";
import { PassNode } from "./nodes/pass";
import { PassBufferSampler } from "./nodes/pass-sampler";
import { PassGraph } from "./pass";

export class WorldGraph extends PassGraph<WorldGraphProps> {
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

	public override setPassInput(_name: string, _type: Type) {
		console.warn("WorldGraph does not has an input");
	}

	public override removePassInput(_name: string) {
		console.warn("WorldGraph does not has an input");
	}
}

export type WorldGraphProps = {
	readonly chunkSize: number;
	readonly worldSize: number;
};
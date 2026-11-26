import { ValueType, type Type } from "./types";
import { GraphInputNode } from "./nodes";
import { PassNode } from "./nodes/pass";
import { PassBufferSampler } from "./nodes/pass-sampler";
import { PassGraph } from "./pass";

export class WorldGraph extends PassGraph<WorldGraphProps> {
	public override get nodeTypes() {
		return [
			...super.nodeTypes,
			PassNode,
			PassBufferSampler,
			GraphInputNode,
		] as PassGraph<WorldGraphProps>["nodeTypes"];
	}

	public override get outputs(): WorldOutputTypes {
		return {
			elevation: ValueType,
			...this.props.outputs,
		} as WorldOutputTypes;
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

export type WorldOutputTypes = Partial<Record<string, Type>> & {
	elevation: ValueType
}
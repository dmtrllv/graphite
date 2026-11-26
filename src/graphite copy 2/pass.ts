import { Graph, type GraphIOMap } from "./graph";
import { DEFAULT_NODE_TYPES } from "./nodes/types";
import type { PassBufferType, Type } from "./types";

export class Pass<I extends PassInputs = PassInputs, O extends PassOutputs = PassOutputs> extends Graph<PassProps<I, O>> implements DynamicPass {
	public override get nodeTypes() {
		return DEFAULT_NODE_TYPES;
	}

	public override get inputTypes(): I {
		return this.props.inputs;
	}

	public override get outputTypes(): O {
		return this.props.outputs;
	}

	public setInputType(name: string, type: Type): never {
		this.props.inputs[name as keyof I] = type as any;
		return void (0) as never;
	}

	public setOutputType(name: string, type: PassBufferType): never {
		this.props.outputs[name as keyof O] = type as any;
		return void (0) as never;
	}

	public removeInputType(name: string): never {
		delete this.props.inputs[name as keyof I];
		return void (0) as never;
	}

	public removeOutputType(name: string): never {
		delete this.props.outputs[name as keyof O];
		return void (0) as never;
	}
}

interface DynamicPass {
	setInputType(name: string, type: Type): void;
	setOutputType(name: string, type: PassBufferType): void;
	removeInputType(name: string): void;
	removeOutputType(name: string): void;
}

export type FixedPass<I extends GraphIOMap, O extends PassOutputs> = Omit<Pass<I, O>, keyof DynamicPass>;

export type PassProps<I extends PassInputs, O extends PassOutputs> = {
	inputs: I;
	outputs: O;
};

export type PassInputs = Record<string, Type>;
export type PassOutputs = Record<string, PassBufferType>;
import { Graph, type GraphIOMap } from "./graph";
import { DEFAULT_NODE_TYPES } from "./nodes/types";
import type { Type } from "./types";

export class SubGraph<I extends SubGraphInputs = SubGraphInputs, O extends SubGraphOutputs = SubGraphOutputs> extends Graph<SubGraphProps<I, O>> {
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

	public setOutputType(name: string, type: Type): never {
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

export type DynamicSubGraph<T extends SubGraph<any, any>> = T & {
	setInputType(name: string, type: Type): void;
	setOutputType(name: string, type: Type): void;
	removeInputType(name: string): void;
	removeOutputType(name: string): void;
}

export type FixedSubGraph<I extends GraphIOMap, O extends SubGraphOutputs> = Omit<SubGraph<I, O>, keyof DynamicSubGraph<any>>;

export type SubGraphProps<I extends SubGraphInputs, O extends SubGraphOutputs> = {
	inputs: I;
	outputs: O;
};

export type SubGraphInputs = Record<string, Type>;
export type SubGraphOutputs = Record<string, Type>;
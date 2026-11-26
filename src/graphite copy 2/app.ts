import type { GraphIOMap, GraphProps } from "./graph";
import { GraphManager } from "./manager";
import type { FixedPass, Pass, PassInputs, PassOutputs, PassProps } from "./pass";
import type { DynamicSubGraph, FixedSubGraph, SubGraph, SubGraphInputs, SubGraphOutputs, SubGraphProps } from "./subgraph";

export class App {
	public static readonly init = async () => {
		const app = new App();

		return app;
	}

	private readonly manager: GraphManager;

	public get world() {
		return this.manager.worldGraph;
	}

	private constructor() {
		this.manager = new GraphManager();
	}

	public createPass(name: string): Pass;
	public createPass<I extends PassInputs = PassInputs, O extends PassOutputs = PassOutputs>(props: GraphProps<PassProps<I, O>>): FixedPass<I, O>;
	public createPass(props: any): Pass {
		if (typeof props === "string")
			return this.manager.createPass({ name: props, inputs: {}, outputs: {} });
		return this.manager.createPass(props);
	}

	public createSubGraph<I extends SubGraphInputs = SubGraphInputs, O extends SubGraphOutputs = SubGraphOutputs>(props: GraphProps<SubGraphProps<I, O>>): SubGraph<I, O>;
	public createSubGraph(name: string): DynamicSubGraph<SubGraph>;
	public createSubGraph(props: any): SubGraph {
		if (typeof props === "string")
			return this.manager.createSubGraph({ name: props, inputs: {}, outputs: {} });
		return this.manager.createSubGraph(props);
	}
}
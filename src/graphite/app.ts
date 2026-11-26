import type { DynamicGraph, GraphIOState, GraphIOTypes } from "./graph";
import { GraphManager } from "./manager";
import { Pass, type PassIOTypes } from "./pass";
import { SubGraph } from "./subgraph";

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

	public createSubGraph(name: string): DynamicGraph<SubGraph>;
	public createSubGraph<I extends GraphIOTypes, O extends GraphIOTypes>(name: string, io: GraphIOState<I, O>): SubGraph<I, O>;
	public createSubGraph(name: string, io: GraphIOState<GraphIOTypes, GraphIOTypes> = {}): SubGraph | DynamicGraph<SubGraph> {
		return this.manager.addGraph(SubGraph, { name, ...io });
	}

	public createPass(name: string): DynamicGraph<Pass>;
	public createPass<I extends PassIOTypes, O extends PassIOTypes>(name: string, io: GraphIOState<I, O>): Pass<I, O>;
	public createPass(name: string, io: GraphIOState<PassIOTypes, PassIOTypes> = {}): Pass | DynamicGraph<Pass> {
		return this.manager.addGraph(Pass, { name, ...io });
	}
}
import type { DynamicGraph, GraphIOState, GraphIOTypes, SerializedGraph } from "./graph";
import { GraphManager } from "./manager";
import { Pass, type PassIOTypes } from "./pass";
import { SubGraph } from "./subgraph";
import type { World } from "./world";

export class Graphite {
	public static deserialize(data: SerializedApp) {
		const app = new Graphite(data.name);

		if(!data.graphs.length)
			return app;

		app.manager.deserializeGraphs(data.graphs);
		
		app.world
		
		return app;
	}

	public static readonly init = async (name: string) => {
		const app = new Graphite(name);

		return app;
	}

	private readonly manager: GraphManager;
	
	public readonly name: string;

	public get world(): World {
		return this.manager.worldGraph;
	}

	private constructor(name: string) {
		this.name = name;
		this.manager = new GraphManager();
	}

	public createSubGraph(name: string): DynamicGraph<SubGraph>;
	public createSubGraph<I extends GraphIOTypes, O extends GraphIOTypes>(name: string, io: GraphIOState<I, O>): SubGraph<I, O>;
	public createSubGraph(name: string, io: GraphIOState<GraphIOTypes, GraphIOTypes> = {}): SubGraph {
		return this.manager.addGraph(SubGraph, { name, ...io });
	}

	public createPass(name: string): DynamicGraph<Pass>;
	public createPass<I extends PassIOTypes, O extends PassIOTypes>(name: string, io: GraphIOState<I, O>): Pass<I, O>;
	public createPass(name: string, io: GraphIOState<PassIOTypes, PassIOTypes> = {}): Pass {
		return this.manager.addGraph(Pass, { name, ...io });
	}

	public toJSON(): SerializedApp {
		return {
			name: this.name,
			graphs: this.manager.getGraphs().map(g => g.toJSON())
		};
	}

	public getGraph(name: string) {
		return this.manager.getGraphs().find(g => g.name === name);
	}
}

export type SerializedApp = {
	readonly name: string;
	readonly graphs: SerializedGraph[];
};
import { Allocator } from "../../utils/allocator";
import { Graph, type GraphType } from "./graph";
import type { SubGraph } from "./subgraph";
import { WorldGraph } from "./world";

export class GraphManager {
	private readonly graphs: Allocator<Graph>;

	public readonly worldGraph!: WorldGraph;

	public getGraphs<T extends Graph>(type: GraphType<T, any>): T[] {
		return this.graphs.all().filter(graph => graph instanceof type) as T[];
	}

	public constructor() {
		this.graphs = new Allocator(Graph);
		this.worldGraph = new WorldGraph(this);
	}

	public createGraph<T extends SubGraph, Args extends any[]>(type: GraphType<T, Args>, name: string, ...args: Args): T {
		return this.graphs.allocWithId(type, name, this, ...args);
	}
}
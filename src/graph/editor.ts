import type { Graph } from "./graph";

export class GraphEditor {
	public readonly graph: Graph;
	
	public constructor(graph: Graph) {
		this.graph = graph;
	}
}
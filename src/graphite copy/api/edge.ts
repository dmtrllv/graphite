import type { Edge as InternalEdge, Graph } from "../graph";
import type { GraphManager } from "../manager";
import { Ref } from "./ref";

export class Edge extends Ref<InternalEdge> {
	private readonly graph: Graph<any>;

	public constructor(manager: GraphManager, graph: Graph<{}>, edge: InternalEdge) {
		super(manager, edge);
		this.graph = graph;
	}

	public remove() {
		this.manager.disconnect(this.graph, this.data);
	}
}
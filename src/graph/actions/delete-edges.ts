import type { GraphAction } from "./action";
import type { Graph, NodeEdge } from "../graph";

export class DeleteEdgesAction implements GraphAction {
	public constructor(private graph: Graph, private edges: NodeEdge[]) { }

	public execute(): void {
		for (const edge of this.edges)
			this.graph.removeEdge(edge);
	}

	public undo(): void {
		for (const edge of this.edges)
			this.graph.restoreEdge(edge);
	}
}

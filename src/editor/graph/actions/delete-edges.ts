import type { EditorAction } from "../../actions";
import type { Graph, } from "../graph";
import type { NodeEdge } from "../edge";

export class DeleteEdgesAction implements EditorAction {
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

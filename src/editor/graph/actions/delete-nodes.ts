import type { Graph } from "../graph";
import type { NodeEdge } from "../edge";
import type { GraphNode } from "../nodes";
import type { GraphAction } from "./action";

export class DeleteNodesAction implements GraphAction {
	private edges: NodeEdge[];

	public constructor(private graph: Graph, private nodes: GraphNode[]) {
		this.edges = [...new Set(nodes.flatMap(node => graph.index.getConnectedEdges(node)))];
	}

	public execute(): void {
		for (const node of this.nodes)
			this.graph.removeNode(node);
	}

	public undo(): void {
		for (const node of this.nodes)
			this.graph.restoreNode(node);

		for (const edge of this.edges)
			this.graph.restoreEdge(edge);
	}
}
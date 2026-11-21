import type { Graph } from "../graph";
import type { NodeEdge } from "../edge";
import type { GraphNode } from "../nodes";
import type { EditorAction } from "../../actions";

export class DeleteNodesAction implements EditorAction {
	private edges: NodeEdge[];
	private nodes: GraphNode[];

	public constructor(private graph: Graph, nodes: GraphNode[]) {
		this.nodes = nodes.filter(node => node.name !== graph.outputNodeName);
		this.edges = [...new Set(this.nodes.flatMap(node => graph.index.getConnectedEdges(node)))];
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

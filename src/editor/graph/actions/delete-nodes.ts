import { GraphAction } from "./graph-action";
import type { NodeEdge } from "../edge";
import type { GraphNode } from "../nodes";
import type { GraphEditor } from "../editor";
import type { ProjectManager } from "../../project-manager";

export class DeleteNodesAction extends GraphAction {
	private edges: NodeEdge[];
	private nodes: GraphNode[];

	public constructor(graphEditor: GraphEditor, projectManager: ProjectManager, nodes: GraphNode[]) {
		super(graphEditor, projectManager);
		this.nodes = nodes.filter(node => node.name !== this.graph.outputNodeName);
		this.edges = [...new Set(this.nodes.flatMap(node => this.graph.index.getConnectedEdges(node)))];
	}

	protected executeAction(): void {
		for (const node of this.nodes)
			this.graph.removeNode(node);
	}

	protected undoAction(): void {
		for (const node of this.nodes)
			this.graph.restoreNode(node);

		for (const edge of this.edges)
			this.graph.restoreEdge(edge);
	}
}
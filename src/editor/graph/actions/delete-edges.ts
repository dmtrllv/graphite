import { GraphAction } from "./graph-action";
import type { NodeEdge } from "../edge";
import type { GraphEditor } from "../editor";
import type { ProjectManager } from "../../project-manager";
import { action } from "../../actions";

@action({ id: "graph.edge.delete", history: true })
export class DeleteEdgesAction extends GraphAction {
	public constructor(graphEditor: GraphEditor, projectManager: ProjectManager, private edges: NodeEdge[]) {
		super(graphEditor, projectManager);
	}

	protected executeAction(): void {
		for (const edge of this.edges)
			this.graph.removeEdge(edge);
	}

	protected undoAction(): void {
		for (const edge of this.edges)
			this.graph.restoreEdge(edge);
	}
}
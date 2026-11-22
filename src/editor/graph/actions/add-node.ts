import { GraphAction } from "./graph-action";
import { type GraphNode, type GraphNodeType } from "../nodes";
import type { Vec2 } from "../types";
import type { GraphEditor } from "../editor";
import type { ProjectManager } from "../../project-manager";
import { action } from "../../actions";

@action({ id: "graph.node.add", history: true })
export class AddNodeAction extends GraphAction {
	public node: GraphNode | null = null;
	private type: GraphNodeType<any>;
	private position: Vec2;

	public constructor(graphEditor: GraphEditor, projectManager: ProjectManager, type: GraphNodeType<any>, position: Vec2) {
		super(graphEditor, projectManager);
		this.type = type;
		this.position = position;
	}

	protected executeAction(): void {
		if (this.node)
			this.graph.restoreNode(this.node);
		else
			this.node = this.graph.addNode(this.type, this.position);
	}

	protected undoAction(): void {
		if (this.node)
			this.graph.removeNode(this.node);
	}
}
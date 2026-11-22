import { GraphAction } from "./graph-action";
import type { GraphNode } from "../nodes";
import { Vec2 } from "../types";
import type { GraphEditor } from "../editor";
import type { ProjectManager } from "../../project-manager";

export type NodePositionChange = {
	node: GraphNode;
	before: Vec2;
	after: Vec2;
};

export class MoveNodesAction extends GraphAction {
	public constructor(graphEditor: GraphEditor, projectManager: ProjectManager, private changes: NodePositionChange[]) {
		super(graphEditor, projectManager);
	}

	protected executeAction(): void {
		for (const change of this.changes)
			change.node.position.set(change.after);
	}

	protected undoAction(): void {
		for (const change of this.changes)
			change.node.position.set(change.before);
	}
}
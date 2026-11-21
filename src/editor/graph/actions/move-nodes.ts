import type { EditorAction } from "../../actions";
import type { GraphNode } from "../nodes";
import { Vec2 } from "../types";

export type NodePositionChange = {
	node: GraphNode;
	before: Vec2;
	after: Vec2;
};

export class MoveNodesAction implements EditorAction {
	public constructor(private changes: NodePositionChange[]) { }

	public execute(): void {
		for (const change of this.changes)
			change.node.position.set(change.after);
	}

	public undo(): void {
		for (const change of this.changes)
			change.node.position.set(change.before);
	}
}

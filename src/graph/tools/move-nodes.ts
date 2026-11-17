import { GraphEditorToolBase, type GraphPointerEvent } from "./tool";
import { MoveNodesAction, type NodePositionChange } from "../actions/move-nodes";
import { Vec2 } from "../types";

export class MoveNodesTool extends GraphEditorToolBase {
	private changes: NodePositionChange[] = [];
	private downPosition = new Vec2();

	public override pointerDown(event: GraphPointerEvent): void {
		const nodes = this.editor.selectedNodes;
		if (!nodes.length) return;

		this.downPosition = new Vec2(event.clientX, event.clientY);

		this.changes = nodes.map(node => ({
			node,
			before: node.position.clone(),
			after: node.position.clone()
		}));
	}

	public override pointerMove(event: GraphPointerEvent): void {
		if (!this.changes.length) return;

		const graph = this.editor.graph;
		const delta = new Vec2(
			(event.clientX - this.downPosition.x) / graph.scale,
			-(event.clientY - this.downPosition.y) / graph.scale
		);

		for (const change of this.changes) {
			change.node.position.set({
				x: change.before.x + delta.x,
				y: change.before.y + delta.y
			});
		}
	}

	public override pointerUp(_event: GraphPointerEvent): void {
		if (!this.changes.length) return;

		const changes = this.changes;
		this.changes = [];

		if (changes.every(change => change.before.distance(change.node.position) === 0))
			return;

		this.editor.history.recordApplied(new MoveNodesAction(changes));
	}

	public override cancel(): void {
		for (const change of this.changes)
			change.node.position.set(change.before);

		this.changes = [];
	}
}

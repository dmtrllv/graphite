import { GraphEditorToolBase, type GraphPointerEvent } from "./tool";
import { MoveNodesAction, type NodePositionChange } from "../actions";
import type { GraphNode } from "../nodes";
import { Vec2 } from "../types";

export type NodeDragLayout = {
	setNodeDragOffset(node: GraphNode, offset: Vec2 | null): void;
};

export class MoveNodesTool extends GraphEditorToolBase {
	private changes: NodePositionChange[] = [];
	private downPosition = new Vec2();
	private delta = new Vec2();

	public constructor(editor: ConstructorParameters<typeof GraphEditorToolBase>[0], private layout: NodeDragLayout, private invalidate: () => void) {
		super(editor);
	}

	public override pointerDown(event: GraphPointerEvent): void {
		const nodes = this.editor.selectedNodes;

		if (!nodes.length)
			return;

		this.downPosition = new Vec2(event.clientX, event.clientY);
		this.delta = new Vec2();
		this.changes = nodes.map(node => ({
			node,
			before: node.position.clone(),
			after: node.position.clone()
		}));
	}

	public override pointerMove(event: GraphPointerEvent): void {
		if (!this.changes.length)
			return;

		const scale = this.editor.viewport.scale;

		this.delta = new Vec2(
			(event.clientX - this.downPosition.x) / scale,
			-(event.clientY - this.downPosition.y) / scale
		);

		for (const change of this.changes)
			this.layout.setNodeDragOffset(change.node, this.delta);

		this.invalidate();
	}

	public override pointerUp(event: GraphPointerEvent): void {
		if (!this.changes.length)
			return;

		this.pointerMove(event);

		const changes = this.changes.map(change => ({
			node: change.node,
			before: change.before,
			after: new Vec2(change.before.x + this.delta.x, change.before.y + this.delta.y)
		}));

		this.changes = [];

		for (const change of changes) {
			change.node.position.set(change.after);
			this.layout.setNodeDragOffset(change.node, null);
		}

		this.invalidate();

		if (changes.every(change => change.before.distance(change.after) === 0))
			return;

		this.editor.actionManager.recordApplied(new MoveNodesAction(this.editor, this.editor.projectManager, changes));
	}

	public override cancel(): void {
		for (const change of this.changes)
			this.layout.setNodeDragOffset(change.node, null);

		this.changes = [];
		this.delta = new Vec2();
		this.invalidate();
	}
}

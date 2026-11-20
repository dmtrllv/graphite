import { GraphEditorToolBase, type GraphPointerEvent } from "./tool";
import { MoveNodesAction, type NodePositionChange } from "../actions";
import { Selection } from "../editor-state";
import type { GraphNode } from "../nodes";
import { Vec2 } from "../types";
import type { GraphEditor } from "../editor";

type GraphSelectionHitTest = {
	getNodesInRect(left: number, top: number, right: number, bottom: number): GraphNode[];
	setNodeDragOffset(node: GraphNode, offset: Vec2 | null): void;
	beginNodeDrag(nodes: GraphNode[]): void;
	endNodeDrag(): void;
};

export class SelectTool extends GraphEditorToolBase {
	private layout: GraphSelectionHitTest;
	private invalidate: () => void;
	private downPosition: Vec2 | null = null;
	private changes: NodePositionChange[] = [];
	private delta = new Vec2();
	private dragging = false;
	private frame: number | null = null;
	private pendingEvent: GraphPointerEvent | null = null;

	public constructor(editor: GraphEditor, layout: GraphSelectionHitTest, invalidate: () => void) {
		super(editor);
		this.layout = layout;
		this.invalidate = invalidate;
	}

	public override pointerDown(event: GraphPointerEvent): void {
		if (event.button !== 0)
			return;

		this.downPosition = event.graphPosition.clone();
		this.changes = [];
		this.delta = new Vec2();
		this.dragging = false;

		if (event.node) {
			if (!this.editor.isSelected(event.node))
				this.editor.selectedNodes = event.shiftKey ? [...this.editor.selectedNodes, event.node] : [event.node];

			this.changes = this.editor.selectedNodes.map(node => ({
				node,
				before: node.position.clone(),
				after: node.position.clone()
			}));

			return;
		}

		this.editor.selectedNodes = [];
		this.editor.selection = new Selection(new Vec2(event.clientX, event.clientY), new Vec2(event.clientX, event.clientY));
	}

	public override pointerMove(event: GraphPointerEvent): void {
		if (!this.downPosition)
			return;

		if (this.changes.length) {
			const delta = event.graphPosition.clone().sub(this.downPosition);

			if (!this.dragging && (delta.x !== 0 || delta.y !== 0)) {
				this.dragging = true;
				this.layout.beginNodeDrag(this.changes.map(change => change.node));
			}

			if (this.dragging)
				this.scheduleDrag(event);

			return;
		}

		if (this.editor.selection) {
			this.editor.selection.mousePos = new Vec2(event.clientX, event.clientY);
			this.editor.selectedNodes = this.layout.getNodesInRect(
				this.editor.selection.downPos.x,
				this.editor.selection.downPos.y,
				event.clientX,
				event.clientY
			);
		}
	}

	public override pointerUp(event: GraphPointerEvent): void {
		if (this.dragging && this.changes.length) {
			this.cancelScheduledDrag();
			this.applyDrag(event);

			const changes = this.changes.map(change => ({
				node: change.node,
				before: change.before,
				after: change.before.clone().add(this.delta)
			}));

			for (const change of changes) {
				change.node.position.set(change.after);
				this.layout.setNodeDragOffset(change.node, null);
			}

			this.layout.endNodeDrag();

			if (changes.some(change => change.before.distance(change.after) > 0))
				this.editor.history.recordApplied(new MoveNodesAction(changes));

			this.invalidate();
		}

		this.editor.selection = null;
		this.downPosition = null;
		this.changes = [];
		this.delta = new Vec2();
		this.dragging = false;
	}

	public override cancel(): void {
		this.cancelScheduledDrag();

		for (const change of this.changes)
			this.layout.setNodeDragOffset(change.node, null);

		if (this.dragging)
			this.layout.endNodeDrag();

		this.editor.selection = null;
		this.downPosition = null;
		this.changes = [];
		this.delta = new Vec2();
		this.dragging = false;
		this.invalidate();
	}

	private scheduleDrag(event: GraphPointerEvent): void {
		this.pendingEvent = event;

		if (this.frame !== null)
			return;

		this.frame = requestAnimationFrame(() => {
			this.frame = null;

			const pending = this.pendingEvent;
			this.pendingEvent = null;

			if (pending && this.dragging)
				this.applyDrag(pending);
		});
	}

	private applyDrag(event: GraphPointerEvent): void {
		if (!this.downPosition)
			return;

		this.delta = event.graphPosition.clone().sub(this.downPosition);

		for (const change of this.changes)
			this.layout.setNodeDragOffset(change.node, this.delta);

		this.invalidate();
	}

	private cancelScheduledDrag(): void {
		if (this.frame !== null)
			cancelAnimationFrame(this.frame);

		this.frame = null;
		this.pendingEvent = null;
	}
}

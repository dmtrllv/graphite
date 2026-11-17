
import { GraphEditorToolBase, type GraphPointerEvent } from "./tool";
import { MoveNodesAction, type NodePositionChange } from "../actions/actions";
import { Selection } from "../editor-state";
import type { GraphNode } from "../nodes";
import { Vec2 } from "../types";
import type { GraphEditor } from "../editor";

type GraphSelectionHitTest = {
	getNodesInRect(left: number, top: number, right: number, bottom: number): GraphNode[];
};

export class SelectTool extends GraphEditorToolBase {
	private layout: GraphSelectionHitTest;
	private downPosition: Vec2 | null = null;
	private changes: NodePositionChange[] = [];
	private dragging = false;

	public constructor(editor: GraphEditor, layout: GraphSelectionHitTest) {
		super(editor);
		this.layout = layout;
	}

	public override pointerDown(event: GraphPointerEvent): void {
		if (event.button !== 0)
			return;

		this.downPosition = event.graphPosition.clone();
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

			if (!this.dragging && delta.distance(new Vec2()) > 0)
				this.dragging = true;

			if (!this.dragging)
				return;

			for (const change of this.changes) {
				change.node.position = change.before.clone().add(delta);
				change.after = change.node.position.clone();
			}

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

	public override pointerUp(_event: GraphPointerEvent): void {
		if (this.dragging && this.changes.length)
			this.editor.history.recordApplied(new MoveNodesAction(this.changes));

		this.editor.selection = null;
		this.downPosition = null;
		this.changes = [];
		this.dragging = false;
	}

	public override cancel(): void {
		for (const change of this.changes)
			change.node.position = change.before.clone();

		this.editor.selection = null;
		this.downPosition = null;
		this.changes = [];
		this.dragging = false;
	}
}

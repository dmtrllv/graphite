import type { GraphEditor } from "../editor";
import { GraphEditorToolBase, type GraphPointerEvent } from "./tool";
import { MoveNodesTool } from "./move-nodes";
import { Selection } from "../editor-state";
import { Vec2 } from "../types";

export class SelectTool extends GraphEditorToolBase {
	private start = new Vec2();
	private moving = false;
	private moveTool: MoveNodesTool;

	public constructor(editor: GraphEditor) {
		super(editor);
		this.moveTool = new MoveNodesTool(editor);
	}

	public override pointerDown(event: GraphPointerEvent): void {
		if (event.button !== 0) return;

		this.start = new Vec2(event.clientX, event.clientY);
		this.moving = false;

		if (this.editor.selectedNodes.length) {
			this.editor.selection = new Selection(this.start.clone(), this.start.clone());
		}
	}

	public override pointerMove(event: GraphPointerEvent): void {
		if (!this.editor.selection) return;

		const current = new Vec2(event.clientX, event.clientY);

		if (!this.moving && current.distance(this.start) > 3) {
			this.moving = true;
			this.moveTool.pointerDown({
				...event,
				clientX: this.start.x,
				clientY: this.start.y
			});
		}

		if (this.moving) {
			this.moveTool.pointerMove(event);
			return;
		}

		this.editor.selection.mousePos = current;
	}

	public override pointerUp(event: GraphPointerEvent): void {
		if (this.moving) {
			this.moveTool.pointerUp(event);
		}

		this.editor.selection = null;
		this.moving = false;
	}

	public override cancel(): void {
		this.moveTool.cancel();
		this.editor.selection = null;
		this.moving = false;
	}
}

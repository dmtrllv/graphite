import { DeleteEdgesAction } from "../actions/actions";
import { EdgeSlice } from "../editor-state";
import { GraphEditorToolBase, type GraphPointerEvent } from "./tool";
import type { NodeEdge } from "../graph";
import type { GraphLayout } from "../../app/graph/rendering/graph-layout";
import { Vec2 } from "../types";

type EdgeHitTest = (start: Vec2, end: Vec2) => NodeEdge[];

export class CutEdgesTool extends GraphEditorToolBase {
	private layout: GraphLayout;
	private hitTest: EdgeHitTest;
	private start: Vec2 | null = null;

	public constructor(editor: GraphEditor, private hitTest: EdgeHitTest) {
		super(editor);
	}

	public override pointerDown(event: GraphPointerEvent): void {
		if (event.button !== 2)
			return;

		this.start = new Vec2(event.clientX, event.clientY);
		this.editor.slice = new EdgeSlice(this.start.clone(), this.start.clone());
	}

	public override pointerMove(event: GraphPointerEvent): void {
		if (!this.start || !this.editor.slice)
			return;

		this.editor.slice.mousePos = new Vec2(event.clientX, event.clientY);
	}

	public override pointerUp(event: GraphPointerEvent): void {
		if (!this.start)
			return;

		const end = new Vec2(event.clientX, event.clientY);
		const edges = this.hitTest(this.start, end);

		if (edges.length)
			this.editor.history.execute(new DeleteEdgesAction(this.editor.graph, edges));

		this.editor.slice = null;
		this.start = null;
	}

	public override cancel(): void {
		this.editor.slice = null;
		this.start = null;
	}
}
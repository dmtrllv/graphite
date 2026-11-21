import type { GraphEditor } from "../editor";
import type { GraphNode } from "../nodes";
import type { Vec2 } from "../types";

export type GraphPointerEvent = {
	clientX: number;
	clientY: number;
	button: number;
	shiftKey: boolean;
	ctrlKey: boolean;
	graphPosition: Vec2;
	node?: GraphNode;
};

export interface GraphEditorTool {
	pointerDown(event: GraphPointerEvent): void;
	pointerMove(event: GraphPointerEvent): void;
	pointerUp(event: GraphPointerEvent): void;
	cancel(): void;
}

export abstract class GraphEditorToolBase implements GraphEditorTool {
	public readonly editor: GraphEditor;

	public constructor(editor: GraphEditor) {
		this.editor = editor;
	}

	public pointerDown(_event: GraphPointerEvent): void { }
	public pointerMove(_event: GraphPointerEvent): void { }
	public pointerUp(_event: GraphPointerEvent): void { }
	public cancel(): void { }
}
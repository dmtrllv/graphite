import type { GraphEditor } from "../editor";

export type GraphPointerEvent = {
	clientX: number;
	clientY: number;
	button: number;
	shiftKey: boolean;
	ctrlKey: boolean;
};

export interface GraphEditorTool {
	pointerDown(event: GraphPointerEvent): void;
	pointerMove(event: GraphPointerEvent): void;
	pointerUp(event: GraphPointerEvent): void;
	cancel(): void;
}

export abstract class GraphEditorToolBase implements GraphEditorTool {
	public constructor(protected editor: GraphEditor) { }

	public pointerDown(_event: GraphPointerEvent): void { }
	public pointerMove(_event: GraphPointerEvent): void { }
	public pointerUp(_event: GraphPointerEvent): void { }
	public cancel(): void { }
}

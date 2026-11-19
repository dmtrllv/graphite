import type { GraphAction } from "./action";

export class GraphEditorHistory {
	private undoStack: GraphAction[] = [];
	private redoStack: GraphAction[] = [];

	public execute(action: GraphAction): void {
		action.execute();
		this.recordApplied(action);
	}

	public recordApplied(action: GraphAction): void {
		this.undoStack.push(action);
		this.redoStack = [];
	}

	public undo(): void {
		const action = this.undoStack.pop();
		if (!action) return;

		action.undo();
		this.redoStack.push(action);
	}

	public redo(): void {
		const action = this.redoStack.pop();
		if (!action) return;

		action.execute();
		this.undoStack.push(action);
	}

	public clear(): void {
		this.undoStack = [];
		this.redoStack = [];
	}

	public get canUndo(): boolean {
		return this.undoStack.length > 0;
	}

	public get canRedo(): boolean {
		return this.redoStack.length > 0;
	}
}

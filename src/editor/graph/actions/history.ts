import type { GraphAction } from "./action";

export class GraphEditorHistory {
	private static readonly MAX_ENTRIES = 100;

	private undoStack: GraphAction[] = [];
	private redoStack: GraphAction[] = [];

	public execute(action: GraphAction): void {
		action.execute();
		this.recordApplied(action);
	}

	public recordApplied(action: GraphAction): void {
		this.undoStack.push(action);
		this.redoStack = [];
		this.trim(this.undoStack);
	}

	public undo(): void {
		const action = this.undoStack.pop();
		if (!action) return;

		action.undo();
		this.redoStack.push(action);
		this.trim(this.redoStack);
	}

	public redo(): void {
		const action = this.redoStack.pop();
		if (!action) return;

		action.execute();
		this.undoStack.push(action);
		this.trim(this.undoStack);
	}

	public clear(): void {
		this.undoStack = [];
		this.redoStack = [];
	}

	private trim(stack: GraphAction[]): void {
		if (stack.length > GraphEditorHistory.MAX_ENTRIES)
			stack.splice(0, stack.length - GraphEditorHistory.MAX_ENTRIES);
	}

	public get canUndo(): boolean {
		return this.undoStack.length > 0;
	}

	public get canRedo(): boolean {
		return this.redoStack.length > 0;
	}
}

import type { EditorAction } from "./action";

export class ActionHistory {
	private static readonly MAX_ENTRIES = 100;

	private undoStack: EditorAction[] = [];
	private redoStack: EditorAction[] = [];

	public execute(action: EditorAction): void {
		action.execute();
		this.recordApplied(action);
	}

	public recordApplied(action: EditorAction): void {
		this.undoStack.push(action);
		this.redoStack = [];
		this.trim(this.undoStack);
	}

	public undo(): void {
		const action = this.undoStack.pop();
		if (!action)
			return;

		action.undo();
		this.redoStack.push(action);
		this.trim(this.redoStack);
	}

	public redo(): void {
		const action = this.redoStack.pop();
		if (!action)
			return;

		action.execute();
		this.undoStack.push(action);
		this.trim(this.undoStack);
	}

	public clear(): void {
		this.undoStack = [];
		this.redoStack = [];
	}

	private trim(stack: EditorAction[]): void {
		if (stack.length > ActionHistory.MAX_ENTRIES)
			stack.splice(0, stack.length - ActionHistory.MAX_ENTRIES);
	}

	public get canUndo(): boolean {
		return this.undoStack.length > 0;
	}

	public get canRedo(): boolean {
		return this.redoStack.length > 0;
	}
}

export interface EditorAction {
	execute(): void;
	undo(): void;
}

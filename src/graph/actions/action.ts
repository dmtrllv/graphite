export interface GraphAction {
	execute(): void;
	undo(): void;
}
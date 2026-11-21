import type { EditorAction } from "../../actions";

export class CompositeAction implements EditorAction {
	public constructor(private actions: EditorAction[]) { }

	public execute(): void {
		for (const action of this.actions)
			action.execute();
	}

	public undo(): void {
		for (const action of [...this.actions].reverse())
			action.undo();
	}
}

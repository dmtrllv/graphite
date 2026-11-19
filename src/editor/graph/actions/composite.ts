import type { GraphAction } from "./action";

export class CompositeAction implements GraphAction {
	public constructor(private actions: GraphAction[]) { }

	public execute(): void {
		for (const action of this.actions)
			action.execute();
	}

	public undo(): void {
		for (const action of [...this.actions].reverse())
			action.undo();
	}
}

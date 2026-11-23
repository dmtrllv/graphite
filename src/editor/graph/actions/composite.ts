import { action, type EditorAction } from "../../actions";

@action({ id: "graph.composite", history: true })
export class CompositeAction implements EditorAction {
	private applied: EditorAction[] = [];

	public constructor(private actions: EditorAction[]) { }

	public execute(): void {
		const executed: EditorAction[] = [];

		try {
			for (const current of this.actions) {
				if (this.applied.includes(current))
					continue;

				current.execute();
				this.applied.push(current);
				executed.push(current);
			}
		} catch (error) {
			const failures: unknown[] = [];

			for (const current of executed.reverse()) {
				try {
					current.undo();
					this.applied.splice(this.applied.indexOf(current), 1);
				} catch (rollbackError) {
					failures.push(rollbackError);
				}
			}

			if (failures.length)
				throw new Error(`Composite execution rollback failed: ${failures.map(String).join("; ")}. Original error: ${String(error)}`);

			throw error;
		}
	}

	public undo(): void {
		const undone: EditorAction[] = [];

		try {
			for (const current of [...this.actions].reverse()) {
				const index = this.applied.indexOf(current);

				if (index === -1)
					continue;

				current.undo();
				this.applied.splice(index, 1);
				undone.push(current);
			}
		} catch (error) {
			const failures: unknown[] = [];

			for (const current of undone.reverse()) {
				try {
					current.execute();
					this.applied.push(current);
				} catch (rollbackError) {
					failures.push(rollbackError);
				}
			}

			if (failures.length)
				throw new Error(`Composite undo rollback failed: ${failures.map(String).join("; ")}. Original error: ${String(error)}`);

			throw error;
		}
	}
}
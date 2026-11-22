import { action, type EditorAction } from "../../actions";

@action({ id: "graph.composite", history: true })
export class CompositeAction implements EditorAction {
	private applied: EditorAction[] = [];

	public constructor(private actions: EditorAction[]) { }

	public execute(): void {
		const executed: EditorAction[] = [];

		for (const current of this.actions) {
			if (this.applied.includes(current))
				continue;

			try {
				current.execute();
			} catch (error) {
				const failures: unknown[] = [];

				try {
					current.undo();
				} catch (rollbackError) {
					failures.push(rollbackError);
				}

				for (const applied of [...executed].reverse()) {
					try {
						applied.undo();
						this.applied.splice(this.applied.indexOf(applied), 1);
					} catch (rollbackError) {
						failures.push(rollbackError);
					}
				}

				if (failures.length)
					throw new Error(`Composite execution rollback failed: ${failures.map(String).join("; ")}. Original error: ${String(error)}`);

				throw error;
			}

			this.applied.push(current);
			executed.push(current);
		}
	}

	public undo(): void {
		for (const current of [...this.actions].reverse()) {
			const index = this.applied.indexOf(current);

			if (index === -1)
				continue;

			current.undo();
			this.applied.splice(index, 1);
		}
	}
}
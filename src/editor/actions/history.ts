import type { EditorAction } from "./action";

export class ActionHistory {
    private static readonly MAX_ENTRIES = 100;

    private undoStack: EditorAction[] = [];
    private redoStack: EditorAction[] = [];
    private transition: "idle" | "executing" | "undoing" | "redoing" = "idle";

    public execute(action: EditorAction): void {
        this.begin("executing");

        try {
            action.execute();
            this.recordApplied(action);
        } catch (error) {
            try {
                action.undo();
            } catch (rollbackError) {
                throw new Error(`Action execution failed and rollback also failed: ${String(rollbackError)}. Original error: ${String(error)}`);
            }

            throw error;
        } finally {
            this.transition = "idle";
        }
    }

    public recordApplied(action: EditorAction): void {
        this.undoStack.push(action);
        this.redoStack = [];
        this.trim(this.undoStack);
    }

    public undo(): void {
        this.begin("undoing");

        try {
            const action = this.undoStack.at(-1);

            if (!action)
                return;

            try {
                action.undo();
            } catch (error) {
                try {
                    action.execute();
                } catch (rollbackError) {
                    throw new Error(`Undo failed and rollback also failed: ${String(rollbackError)}. Original error: ${String(error)}`);
                }

                throw error;
            }

            this.undoStack.pop();
            this.redoStack.push(action);
            this.trim(this.redoStack);
        } finally {
            this.transition = "idle";
        }
    }

    public redo(): void {
        this.begin("redoing");

        try {
            const action = this.redoStack.at(-1);

            if (!action)
                return;

            try {
                action.execute();
            } catch (error) {
                try {
                    action.undo();
                } catch (rollbackError) {
                    throw new Error(`Redo failed and rollback also failed: ${String(rollbackError)}. Original error: ${String(error)}`);
                }

                throw error;
            }

            this.redoStack.pop();
            this.undoStack.push(action);
            this.trim(this.undoStack);
        } finally {
            this.transition = "idle";
        }
    }

    public clear(): void {
        if (this.transition !== "idle")
            throw new Error("Cannot clear action history during a history transition!");

        this.undoStack = [];
        this.redoStack = [];
    }

    private begin(transition: typeof this.transition): void {
        if (this.transition !== "idle")
            throw new Error(`Cannot start ${transition} while history is ${this.transition}!`);

        this.transition = transition;
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

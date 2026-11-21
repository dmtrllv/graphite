import type { EditorAction } from "../../actions";
import type { WindowManager, WindowManagerSnapshot } from "../window-manager";

export class WindowLayoutAction implements EditorAction {
	private manager: WindowManager;
	private before: WindowManagerSnapshot;
	private after: WindowManagerSnapshot;

	public constructor(manager: WindowManager, before: WindowManagerSnapshot, after: WindowManagerSnapshot) {
		this.manager = manager;
		this.before = before;
		this.after = after;
	}

	public execute(): void {
		this.manager.restoreLayoutState(this.after);
	}

	public undo(): void {
		this.manager.restoreLayoutState(this.before);
	}
}
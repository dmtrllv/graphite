import { observable } from "../reactive";
import type { Window } from "./window";

export class EditorLayout {
	private static _idCounter = 0;

	public readonly id: number = EditorLayout._idCounter++;

	@observable
	public accessor parent: EditorLayout | null;

	@observable
	public accessor direction: "horizontal" | "vertical" = "horizontal";

	@observable
	public accessor children: (EditorLayout | LayoutPanel<any, any>)[];

	public constructor(parent: EditorLayout | null, children: (EditorLayout | LayoutPanel<any, any>)[] = []) {
		this.parent = parent;
		this.children = children;
	}
}

export class LayoutPanel<T extends React.FC<P>, P extends {}> {
	private static _idCounter = 0;

	public readonly id: number = LayoutPanel._idCounter++;

	@observable
	public accessor layout: EditorLayout;
	
	@observable
	public accessor tabs: Window<T, P>[];

	public constructor(layout: EditorLayout, tabs: Window<T, P>[]) {
		this.layout = layout;
		this.tabs = tabs;
	}
}
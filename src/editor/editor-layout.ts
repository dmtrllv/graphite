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
	public accessor children: (EditorLayout | LayoutPanel)[];

	public constructor(parent: EditorLayout | null, children: (EditorLayout | LayoutPanel)[] = []) {
		this.parent = parent;
		this.children = children;
	}

	public addPanel(window: Window<any, any>) {
		this.children.push(new LayoutPanel(this, [window]));
	}
}

export class LayoutPanel {
	private static _idCounter = 0;

	public readonly id: number = LayoutPanel._idCounter++;

	@observable
	public accessor layout: EditorLayout;

	@observable
	public accessor tabs: Window<any, any>[];

	@observable
	public accessor activeTab: number = 0;

	public constructor(layout: EditorLayout, tabs: Window<any, any>[]) {
		this.layout = layout;
		this.tabs = tabs;
	}
}
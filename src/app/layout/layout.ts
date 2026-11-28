import { observable } from "@reactive";
import type { Window } from "./window";

@observable
export class Layout {
	private static _idCounter = 0;

	public readonly id: number = Layout._idCounter++;

	@observable
	public accessor parent: Layout | null;

	@observable
	public accessor direction: "horizontal" | "vertical" = "horizontal";

	@observable
	public accessor children: (Layout | LayoutPanel)[];

	@observable
	public accessor size: number = 1;

	public constructor(parent: Layout | null, children: (Layout | LayoutPanel)[] = []) {
		this.parent = parent;
		this.children = children;

		for (const child of children)
			child.parent = this;
	}

	public resize(index: number, delta: number, totalSize: number, minSize: number = 120): void {
		const first = this.children[index];
		const second = this.children[index + 1];
		if (!first || !second || totalSize <= 0)
			return;

		const totalWeight = first.size + second.size;
		if (totalWeight <= 0)
			return;

		const minWeight = Math.min(totalWeight / 2, totalWeight * minSize / totalSize);
		const deltaWeight = delta / totalSize * totalWeight;
		first.size = Math.max(minWeight, Math.min(totalWeight - minWeight, first.size + deltaWeight));
		second.size = totalWeight - first.size;
	}
}

@observable
export class LayoutPanel {
	private static _idCounter = 0;

	public readonly id: number = LayoutPanel._idCounter++;

	@observable
	public accessor parent: Layout;

	@observable
	public accessor tabs: Window<any>[];

	@observable
	public accessor activeTab: number = 0;

	@observable
	public accessor size: number = 1;

	public constructor(parent: Layout, tabs: Window<any>[]) {
		this.parent = parent;
		this.tabs = tabs;
	}

	public activate(window: Window<any>): void {
		const index = this.tabs.indexOf(window);
		if (index !== -1)
			this.activeTab = index;
	}
}
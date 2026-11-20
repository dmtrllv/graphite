import { observable } from "../reactive";
import { EditorLayout, LayoutPanel } from "./editor-layout";
import { Window, type WindowBounds, type WindowOpenOptions } from "./window";

export type DockPosition = "center" | "left" | "right" | "top" | "bottom";

export type DropTarget = { panelId: number; position: DockPosition | "float" } | null;

export type WindowOptions = WindowOpenOptions & {
	float?: boolean;
	check?: (window: Window) => boolean | undefined;
};

@observable
export class WindowManager {
	public readonly layout: EditorLayout;

	@observable
	public accessor windows: Window[] = [];

	@observable
	public accessor floatingWindows: Window[] = [];

	public constructor(layout: EditorLayout) {
		this.layout = layout;
	}

	public open<P extends object = Record<string, never>>(title: string, component: string, props: P, { float, check, ...options }: WindowOptions = {}): Window<P> {
		const found = this.windows.find(window => check ? check(window) : window.component === component && window.isSingleInstance);

		if (found)
			return found as Window<P>;

		const window = new Window(this, title, component, props, options);
		this.windows.push(window);

		if (float)
			this.float(window);
		else
			this.dockToRoot(window);

		return window;
	}

	public close(window: Window): void {
		if (!this.windows.includes(window))
			return;

		this.detach(window);
		this.windows = this.windows.filter(item => item !== window);
		window.onClose();
	}

	public activate(panel: LayoutPanel, window: Window): void {
		panel.activate(window);
	}

	public getPanel(id: number): LayoutPanel | null {
		const find = (layout: EditorLayout): LayoutPanel | null => {
			for (const child of layout.children) {
				if (child instanceof LayoutPanel && child.id === id)
					return child;

				if (child instanceof EditorLayout) {
					const result = find(child);

					if (result)
						return result;
				}
			}

			return null;
		};

		return find(this.layout);
	}

	public dock(window: Window, target: LayoutPanel, position: DockPosition): void {
		const source = this.findPanel(window);

		if (source === target && position === "center") {
			target.activate(window);
			return;
		}

		if (source === target && source.tabs.length === 1)
			return;

		this.detach(window);

		if (position === "center") {
			target.tabs.push(window);
			target.activate(window);
		} else {
			this.split(target, new LayoutPanel(target.parent, [window]), position);
		}

		window.state = "docked";
	}

	public dockToRoot(window: Window): void {
		this.detach(window);
		this.layout.children.push(new LayoutPanel(this.layout, [window]));
		window.state = "docked";
	}

	public float(window: Window, bounds: Partial<WindowBounds> | "centered" = "centered"): void {
		this.detach(window);

		if (bounds === "centered") {
			const x = (globalThis.window?.innerWidth ?? window.bounds.width) / 2 - window.bounds.width / 2;
			const y = (globalThis.window?.innerHeight ?? window.bounds.height) / 2 - window.bounds.height / 2;
			window.bounds = { ...window.bounds, x, y };
		} else {
			window.bounds = { ...window.bounds, ...bounds };
		}

		this.floatingWindows.push(window);
		window.state = "floating";
	}

	private split(target: LayoutPanel, panel: LayoutPanel, position: Exclude<DockPosition, "center">): void {
		const parent = target.parent;
		const index = parent.children.indexOf(target);

		if (index === -1)
			return;

		const split = new EditorLayout(parent);
		split.direction = position === "left" || position === "right" ? "horizontal" : "vertical";
		split.size = target.size;

		target.size = 1;
		panel.size = 1;
		target.parent = split;
		panel.parent = split;

		if (position === "left" || position === "top")
			split.children = [panel, target];
		else
			split.children = [target, panel];

		parent.children[index] = split;
	}

	private findPanel(window: Window): LayoutPanel | null {
		const find = (layout: EditorLayout): LayoutPanel | null => {
			for (const child of layout.children) {
				if (child instanceof LayoutPanel && child.tabs.includes(window))
					return child;

				if (child instanceof EditorLayout) {
					const result = find(child);

					if (result)
						return result;
				}
			}

			return null;
		};

		return find(this.layout);
	}

	private detach(window: Window): void {
		this.floatingWindows = this.floatingWindows.filter(item => item !== window);

		const panel = this.findPanel(window);

		if (!panel)
			return;

		const index = panel.tabs.indexOf(window);

		if (index === -1)
			return;

		panel.tabs.splice(index, 1);

		if (panel.activeTab >= panel.tabs.length)
			panel.activeTab = panel.tabs.length - 1;
		else if (index < panel.activeTab)
			panel.activeTab--;

		if (panel.tabs.length === 0)
			this.removePanel(panel);
	}

	private removePanel(panel: LayoutPanel): void {
		const parent = panel.parent;
		const index = parent.children.indexOf(panel);

		if (index === -1)
			return;

		parent.children.splice(index, 1);
		this.normalize(parent);
	}

	private normalize(layout: EditorLayout): void {
		for (const child of [...layout.children]) {
			if (child instanceof EditorLayout)
				this.normalize(child);
		}

		if (layout === this.layout || layout.children.length !== 1)
			return;

		const parent = layout.parent;

		if (!parent)
			return;

		const index = parent.children.indexOf(layout);

		if (index === -1)
			return;

		const child = layout.children[0];

		if (!child)
			return;

		child.parent = parent;
		child.size = layout.size;
		parent.children[index] = child;
		this.normalize(parent);
	}

	public closeAll(): void {
		for (const window of [...this.windows])
			this.close(window);

		this.windows = [];
	}
}

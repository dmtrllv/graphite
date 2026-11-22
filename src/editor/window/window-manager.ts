import { observable } from "@reactive";
import { EditorLayout, LayoutPanel } from "../editor-layout";
import { Window, type WindowBounds, type WindowOpenOptions } from "./window";
import type { ActionManager } from "../actions";

export type DockPosition = "center" | "left" | "right" | "top" | "bottom";

export type DropTarget = { panelId: number; position: DockPosition | "float" } | null;

export type WindowOptions = WindowOpenOptions & {
	float?: boolean | undefined;
	check?: (window: Window) => boolean | undefined;
};

export type WindowPlacement =
	| { state: "floating"; bounds: WindowBounds }
	| {
		state: "docked";
		panel: LayoutPanel;
		parent: EditorLayout;
		panelIndex: number;
		tabIndex: number;
		activeWindow: Window | undefined;
		panelSize: number;
	};

@observable
export class WindowManager {
	public readonly layout: EditorLayout;
	public readonly actionManager: ActionManager;

	@observable
	public accessor windows: Window[] = [];

	@observable
	public accessor floatingWindows: Window[] = [];

	private placements = new WeakMap<object, WindowPlacement>();

	public constructor(layout: EditorLayout, actionManager: ActionManager) {
		this.layout = layout;
		this.actionManager = actionManager;
	}

	public open<P extends object = Record<string, never>>(title: string, component: string, props: P, { float, check, placementKey, ...options }: WindowOptions = {}): Window<P> {
		const found = this.windows.find(window => check ? check(window) : window.component === component && window.isSingleInstance);

		if (found) {
			this.activateWindow(found);
			return found as Window<P>;
		}

		const window = new Window(this, title, component, props, { ...options, placementKey });
		this.windows = [...this.windows, window];

		if (!this.restorePlacement(window, placementKey)) {
			if (float)
				this.float(window);
			else
				this.dockToRoot(window);
		}

		this.activateWindow(window);

		return window;
	}

	public close(window: Window): void {
		if (!this.windows.includes(window))
			return;

		this.actionManager.deactivate(window);
		this.savePlacement(window);
		this.detach(window);
		this.windows = this.windows.filter(item => item !== window);
		window.onClose();
	}

	public activate(panel: LayoutPanel, window: Window): void {
		panel.activate(window);
		this.activateWindow(window);
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
			this.activateWindow(window);
			return;
		}

		if (source === target && source.tabs.length === 1)
			return;

		this.detach(window);

		if (position === "center") {
			target.tabs = [...target.tabs, window];
			target.activate(window);
		} else {
			this.split(target, new LayoutPanel(target.parent, [window]), position);
		}

		window.state = "docked";
		this.activateWindow(window);
	}

	public dockToRoot(window: Window): void {
		this.detach(window);
		this.layout.children = [...this.layout.children, new LayoutPanel(this.layout, [window])];
		window.state = "docked";
		this.activateWindow(window);
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

		this.floatingWindows = [...this.floatingWindows, window];
		window.state = "floating";
		this.activateWindow(window);
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

		parent.children = parent.children.map((child, i) => i === index ? split : child);
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

		panel.tabs = panel.tabs.filter(item => item !== window);

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

		parent.children = parent.children.filter(child => child !== panel);
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
		parent.children = parent.children.map((item, i) => i === index ? child : item);
		this.normalize(parent);
	}

	public closeAll(): void {
		for (const window of [...this.windows])
			this.close(window);

		this.windows = [];
	}

	public activateWindow(window: Window): void {
		const panel = this.findPanel(window);

		if (panel)
			panel.activate(window);

		if (window.state === "floating")
			this.floatingWindows = [...this.floatingWindows.filter(item => item !== window), window];

		this.actionManager.activate(window);
	}

	private isLayoutAttached(target: EditorLayout): boolean {
		const contains = (layout: EditorLayout): boolean => {
			if (layout === target)
				return true;

			return layout.children.some(child => child instanceof EditorLayout && contains(child));
		};

		return contains(this.layout);
	}

	private savePlacement(window: Window): void {
		const key = window.placementKey;

		if (!key)
			return;

		if (window.state === "floating") {
			this.placements.set(key, { state: "floating", bounds: { ...window.bounds } });
			return;
		}

		const panel = this.findPanel(window);

		if (!panel)
			return;

		this.placements.set(key, {
			state: "docked",
			panel,
			parent: panel.parent,
			panelIndex: panel.parent.children.indexOf(panel),
			tabIndex: panel.tabs.indexOf(window),
			activeWindow: panel.tabs[panel.activeTab],
			panelSize: panel.size
		});
	}

	private restorePlacement(window: Window, key?: object): boolean {
		if (!key)
			return false;

		const placement = this.placements.get(key);

		if (!placement)
			return false;

		if (placement.state === "floating") {
			window.bounds = { ...placement.bounds };
			window.state = "floating";
			this.floatingWindows.push(window);
			return true;
		}

		const { panel, parent, panelIndex, tabIndex, activeWindow, panelSize } = placement;

		if (this.getPanel(panel.id) === panel) {
			const index = Math.max(0, Math.min(tabIndex, panel.tabs.length));
			panel.tabs = [...panel.tabs.slice(0, index), window, ...panel.tabs.slice(index)];

			if (activeWindow && panel.tabs.includes(activeWindow))
				panel.activeTab = panel.tabs.indexOf(activeWindow);
			else
				panel.activate(window);

			window.state = "docked";
			return true;
		}

		if (this.isLayoutAttached(parent)) {
			panel.parent = parent;
			panel.tabs = [window];
			panel.activeTab = 0;
			panel.size = panelSize;
			window.state = "docked";
			const index = Math.max(0, Math.min(panelIndex, parent.children.length));
			parent.children = [...parent.children.slice(0, index), panel, ...parent.children.slice(index)];
			return true;
		}

		this.dockToRoot(window);
		return true;
	}
}

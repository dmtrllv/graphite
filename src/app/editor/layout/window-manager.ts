import { observable } from "@reactive";
import { EditorLayout, LayoutPanel } from "./layout";
import { Window, type WindowBounds, type WindowType } from "./window";
import type { Editor } from "../editor";

export type DockPosition = "center" | "left" | "right" | "top" | "bottom";

export type DropTarget = { panelId: number; position: DockPosition | "float" } | null;

export type WindowOptions = {
	float?: boolean | undefined;
};

type LayoutPlacement = {
	layout: EditorLayout;
	parent: EditorLayout;
	index: number;
	direction: EditorLayout["direction"];
	size: number;
	children: {
		child: EditorLayout | LayoutPanel;
		size: number;
	}[];
};

export type WindowPlacement =
	| { state: "floating"; bounds: WindowBounds }
	| {
		state: "docked";
		panel: LayoutPanel;
		path: LayoutPlacement[];
		tabIndex: number;
		activeWindow: Window<any> | undefined;
		panelSize: number;
	};


type WindowOpenOptions<P extends object> = P & {
	title?: string;
	float?: boolean;
	width?: number;
	height?: number;
}

@observable
export class WindowManager {
	public readonly editor: Editor;

	@observable
	public accessor windows: Window<any>[] = [];

	@observable
	public accessor floatingWindows: Window<any>[] = [];

	public constructor(editor: Editor) {
		this.editor = editor;
	}

	public open(type: WindowType<{}>): Window<{}>;
	public open<P extends object>(type: WindowType<P>, options: WindowOpenOptions<P>): Window<P>;
	public open<P extends object>(type: WindowType<P>, options: WindowOpenOptions<P> = {} as WindowOpenOptions<P>) {
		const props = { ...type, ...options };

		const found = props.singleInstance && this.windows.find(window => (window.component === props.component));

		if (found) {
			this.activateWindow(found);
			return found as Window<P>;
		}

		const window = new Window(this, props);
		this.windows = [...this.windows, window];

		if (props.float || (props.dockable === false))
			this.float(window);
		else
			this.dockToRoot(window);

		this.activateWindow(window);

		return window;
	}

	public close(window: Window<any>): void {
		if (!this.windows.includes(window))
			return;

		this.detach(window);
		this.windows = this.windows.filter(item => item !== window);
		//window.onClose();
	}

	public activate(panel: LayoutPanel, window: Window<any>): void {
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

		return find(this.editor.layout);
	}

	public dock(window: Window<any>, target: LayoutPanel, position: DockPosition): void {
		if(!window.dockable)
			return;

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

	public dockToRoot(window: Window<any>): void {
		if(!window.dockable)
			return;
		
		this.detach(window);
		this.editor.layout.children = [...this.editor.layout.children, new LayoutPanel(this.editor.layout, [window])];
		window.state = "docked";
		this.activateWindow(window);
	}

	public float(window: Window<any>, bounds: Partial<WindowBounds> | "centered" = "centered"): void {
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

	private findPanel(window: Window<any>): LayoutPanel | null {
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

		return find(this.editor.layout);
	}

	private detach(window: Window<any>): void {
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

		if (layout === this.editor.layout || layout.children.length !== 1)
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

	public activateWindow(window: Window<any>): void {
		const panel = this.findPanel(window);

		if (panel)
			panel.activate(window);

		if (window.state === "floating")
			this.floatingWindows = [...this.floatingWindows.filter(item => item !== window), window];
	}
}
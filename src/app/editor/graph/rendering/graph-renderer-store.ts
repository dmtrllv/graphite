import { subscribe } from "@reactive";
import type { Graph, GraphNode, GraphEditor } from "@editor";
import { GraphLayout } from "./graph-layout";
import { GraphCanvasRenderer } from "./renderer";
import { RenderScheduler } from "./render-scheduler";
import type { GraphSettings } from "../../../../editor/settings";

export class GraphRendererStore {
	public readonly graph: Graph;
	public readonly editor: GraphEditor;
	public readonly layout = new GraphLayout();
	public readonly renderer = new GraphCanvasRenderer();
	public readonly settings: GraphSettings;

	private canvas: HTMLCanvasElement | null = null;
	private scheduler = new RenderScheduler(() => this.render());
	private unsubscribers: (() => void)[] = [];
	private layoutDirty = true;

	public constructor(editor: GraphEditor, settings: GraphSettings) {
		this.editor = editor;
		this.graph = editor.graph;
		this.settings = settings;
	}

	public attach(canvas: HTMLCanvasElement): void {
		this.detach();
		this.canvas = canvas;
		this.layoutDirty = true;

		this.unsubscribers = [
			subscribe(this.graph, "offset", { recursive: true }, this.invalidateLayout),
			subscribe(this.graph, "scale", this.invalidateLayout),
			subscribe(this.graph, "structureVersion", this.invalidateLayout),
			subscribe(this.editor, "selectedNodes", { recursive: true }, this.invalidate),
			subscribe(this.editor, "draggingEdge", { recursive: true }, this.invalidate),
			subscribe(this.editor, "edgeCut", { recursive: true }, this.invalidate),
			subscribe(this.settings, "lineWidth", { recursive: true }, this.invalidate),
			subscribe(this.settings, "curve", { recursive: true }, this.invalidate),
		];

		this.invalidate();
	}

	public detach(): void {
		for (const unsubscribe of this.unsubscribers)
			unsubscribe();

		this.unsubscribers = [];
		this.canvas = null;
		this.scheduler.dispose();
		this.renderer.clear();
	}

	public invalidate = (): void => {
		this.scheduler.invalidate();
	};

	public invalidateLayout = (): void => {
		this.layoutDirty = true;
		this.invalidate();
	};

	public updateNode(node: GraphNode): void {
		if (!this.canvas)
			return;

		if (this.layout.updateNode(node, this.graph, this.canvas))
			this.invalidate();
	}

	public removeNode(node: GraphNode): void {
		this.layout.removeNode(node);
		this.invalidate();
	}

	private render(): void {
		if (!this.canvas)
			return;

		if (this.layoutDirty) {
			this.layout.updateAll(this.graph, this.canvas);
			this.layoutDirty = false;
		}

		this.renderer.render(this.graph, this.editor, this.canvas, this.layout, this.settings);
	}
}

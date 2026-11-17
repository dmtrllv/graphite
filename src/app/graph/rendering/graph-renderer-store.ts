import { subscribe } from "../../../reactive";
import type { Graph } from "../../../graph";
import type { GraphEditor } from "../../../graph/editor";
import { GraphLayout } from "./graph-layout";
import { GraphCanvasRenderer } from "./renderer";
import { RenderScheduler } from "./render-scheduler";

export class GraphRendererStore {
	public readonly graph: Graph;
	public readonly editor: GraphEditor;
	public readonly layout = new GraphLayout();
	public readonly renderer = new GraphCanvasRenderer();

	private canvas: HTMLCanvasElement | null = null;
	private scheduler = new RenderScheduler(() => this.render());
	private unsubscribers: (() => void)[] = [];

	public constructor(editor: GraphEditor) {
		this.editor = editor;
		this.graph = editor.graph;
	}

	public attach(canvas: HTMLCanvasElement): void {
		this.detach();
		this.canvas = canvas;

		this.unsubscribers = [
			subscribe(this.graph, "offset", { recursive: true }, this.invalidate),
			subscribe(this.graph, "scale", this.invalidate),
			subscribe(this.graph, "structureVersion", this.invalidate),
			subscribe(this.editor, "draggingEdge", { recursive: true }, this.invalidate),
			subscribe(this.editor, "slice", { recursive: true }, this.invalidate)
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

	public updateNode(node: import("../../../graph/nodes").GraphNode): void {
		if (!this.canvas)
			return;

		if (this.layout.updateNode(node, this.graph, this.canvas))
			this.invalidate();
	}

	public removeNode(node: import("../../../graph/nodes").GraphNode): void {
		this.layout.removeNode(node);
		this.invalidate();
	}

	private render(): void {
		if (!this.canvas)
			return;

		this.renderer.render(this.graph, this.editor, this.canvas, this.layout);
	}
}
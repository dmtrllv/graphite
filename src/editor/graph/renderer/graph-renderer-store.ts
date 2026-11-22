import { subscribe } from "@reactive";
import type { Graph } from "../graph";
import type { GraphNode } from "../nodes";
import type { GraphEditor } from "../editor";
import { GraphLayout } from "./graph-layout";
import { GraphCanvasRenderer } from "./renderer";
import { RenderScheduler } from "./render-scheduler";
import type { GraphSettings } from "../../settings";

export class GraphRendererStore {
	public readonly graph: Graph;
	public readonly editor: GraphEditor;
	public readonly layout = new GraphLayout();
	public readonly renderer = new GraphCanvasRenderer();
	public readonly settings: GraphSettings;

	private canvas: HTMLCanvasElement | null = null;
	private bounds: DOMRectReadOnly | null = null;
	private observer: ResizeObserver | null = null;
	private scheduler = new RenderScheduler(() => this.render());
	private unsubscribers: (() => void)[] = [];
	private graphElement: HTMLDivElement | null = null;

	public constructor(editor: GraphEditor, settings: GraphSettings) {
		this.editor = editor;
		this.graph = editor.graph;
		this.settings = settings;
	}

	public attach(canvas: HTMLCanvasElement, graphElement: HTMLDivElement): void {
		this.detach(false);
		this.canvas = canvas;
		this.graphElement = graphElement;
		this.bounds = canvas.getBoundingClientRect();
		this.renderer.invalidateGraph(this.graph);

		this.observer = new ResizeObserver(() => {
			if (!this.canvas)
				return;

			this.bounds = this.canvas.getBoundingClientRect();
			this.invalidateStatic();
		});

		this.observer.observe(canvas);

		this.unsubscribers = [
			subscribe(this.editor.viewport, { recursive: true }, () => this.invalidateStatic()),
			subscribe(this.graph, e => {
				if (e.key === "structureVersion") {
					this.renderer.invalidateGraph(this.graph);
					this.invalidate();
				}
			}),
			subscribe(this.editor, { recursive: true }, e => {
				if (e.path === "draggingEdge" || e.path.startsWith("draggingEdge.") || e.path === "edgeCut" || e.path.startsWith("edgeCut."))
					this.invalidate();
			}),
			subscribe(this.settings, e => {
				if (e.key === "lineWidth" || e.key === "curve")
					this.invalidateStatic();
			})
		];

		this.invalidate();
	}

	public detach(clearLayout = true): void {
		for (const unsubscribe of this.unsubscribers)
			unsubscribe();

		this.graphElement = null;
		this.unsubscribers = [];
		this.observer?.disconnect();
		this.observer = null;
		this.canvas = null;
		this.bounds = null;
		this.scheduler.dispose();
		this.renderer.clear();

		if (clearLayout)
			this.layout.clear();
	}

	public invalidate = (): void => {
		this.scheduler.invalidate();
	};

	public invalidateStatic = (): void => {
		this.renderer.invalidateStatic();
		this.invalidate();
	};

	public updateNode(node: GraphNode): void {
		if (!this.canvas)
			return;

		if (this.layout.updateNode(node, this.editor, this.canvas))
			this.invalidateStatic();
	}

	public removeNode(node: GraphNode): void {
		this.layout.removeNode(node);
		this.invalidateStatic();
	}

	public beginNodeDrag(nodes: GraphNode[]): void {
		this.renderer.beginNodeDrag(this.graph, nodes);
		this.invalidate();
	}

	public endNodeDrag(): void {
		this.renderer.endNodeDrag();
		this.invalidate();
	}

	private render(): void {
	if (!this.canvas || !this.bounds)
		return;

	if (this.graphElement) {
		const { offset, scale } = this.editor.viewport;
		this.graphElement.style.left = `calc(50% + ${offset.x}px)`;
		this.graphElement.style.top = `calc(50% + ${-offset.y}px)`;
		this.graphElement.style.transform = `translate(-50%, -50%) scale(${scale})`;
	}

	this.layout.flushNodeDragOffsets(this.editor, this.canvas);
	this.renderer.render(this.graph, this.editor, this.canvas, this.layout, this.settings, this.bounds);
}
}

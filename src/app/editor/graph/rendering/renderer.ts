import { Vec2, type NodeEdge, type GraphEditor, Graph, GraphNode } from "@editor";
import { EdgeRenderer } from "./edge-renderer";
import { GraphLayout } from "./graph-layout";
import type { GraphSettings } from "../../../../editor/settings";

export class GraphCanvasRenderer {
	private edges = new EdgeRenderer();
	private staticCanvas: HTMLCanvasElement | null = null;
	private dynamicEdges = new Map<number, NodeEdge>();
	private staticDirty = true;

	private stats = {
		renderMs: 0,
		staticEdges: 0,
		dynamicEdges: 0
	};

	public get diagnostics() {
		return { ...this.stats };
	}

	public render(graph: Graph, editor: GraphEditor, canvas: HTMLCanvasElement, layout: GraphLayout, settings: GraphSettings, rect: DOMRectReadOnly): void {
		const start = performance.now();

		const dpr = window.devicePixelRatio || 1;
		const width = Math.round(rect.width * dpr);
		const height = Math.round(rect.height * dpr);

		if (canvas.width !== width)
			canvas.width = width;

		if (canvas.height !== height)
			canvas.height = height;

		if (!this.staticCanvas)
			this.staticCanvas = document.createElement("canvas");

		if (this.staticCanvas.width !== width) {
			this.staticCanvas.width = width;
			this.staticDirty = true;
		}

		if (this.staticCanvas.height !== height) {
			this.staticCanvas.height = height;
			this.staticDirty = true;
		}

		const ctx = canvas.getContext("2d");
		const staticCtx = this.staticCanvas.getContext("2d");

		if (!ctx || !staticCtx)
			return;

		if (this.staticDirty) {
			staticCtx.setTransform(1, 0, 0, 1, 0, 0);
			staticCtx.clearRect(0, 0, width, height);
			staticCtx.save();
			this.setGraphTransform(staticCtx, graph, rect, dpr);
			this.setLineStyle(staticCtx, settings);
			this.stats.staticEdges = this.edges.renderEdges(graph.edges.values(), layout, staticCtx, settings, edge => !this.dynamicEdges.has(edge.id));
			staticCtx.restore();
			this.staticDirty = false;
		}

		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, width, height);
		ctx.drawImage(this.staticCanvas, 0, 0);
		ctx.save();
		this.setGraphTransform(ctx, graph, rect, dpr);
		this.setLineStyle(ctx, settings);
		this.stats.dynamicEdges = this.edges.renderEdges(this.dynamicEdges.values(), layout, ctx, settings);
		this.edges.renderInteractive(graph, editor, layout, ctx, settings);
		ctx.restore();
		this.stats.renderMs = performance.now() - start;
	}

	public beginNodeDrag(graph: Graph, nodes: GraphNode[]): void {
		this.dynamicEdges.clear();

		for (const node of nodes) {
			for (const edge of graph.index.getConnectedEdges(node))
				this.dynamicEdges.set(edge.id, edge);
		}

		this.staticDirty = true;
	}

	public endNodeDrag(): void {
		this.dynamicEdges.clear();
		this.staticDirty = true;
	}

	public invalidateStatic(): void {
		this.staticDirty = true;
	}

	public invalidateGraph(graph: Graph): void {
		this.edges.sync(graph);

		for (const [id, edge] of this.dynamicEdges) {
			if (graph.edges.get(id) !== edge)
				this.dynamicEdges.delete(id);
		}

		this.staticDirty = true;
	}

	public getIntersectingEdges(graph: Graph, layout: GraphLayout, canvas: HTMLCanvasElement, start: Vec2, end: Vec2): NodeEdge[] {
		return this.edges.getIntersectingEdges(graph, layout, canvas, start, end);
	}

	public clear(): void {
		this.edges.clear();
		this.dynamicEdges.clear();
		this.staticCanvas = null;
		this.staticDirty = true;
	}

	private setGraphTransform(ctx: CanvasRenderingContext2D, graph: Graph, rect: DOMRectReadOnly, dpr: number): void {
		ctx.setTransform(
			dpr * graph.scale, 0,
			0, -dpr * graph.scale,
			dpr * (rect.width / 2 + graph.offset.x),
			dpr * (rect.height / 2 - graph.offset.y)
		);
	}

	private setLineStyle(ctx: CanvasRenderingContext2D, settings: GraphSettings): void {
		ctx.lineWidth = settings.lineWidth;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.strokeStyle = "white";
	}
}
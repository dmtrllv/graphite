import { Vec2, type NodeEdge, type GraphEditor, Graph } from "@editor";
import { EdgeRenderer } from "./edge-renderer";
import { GraphLayout } from "./graph-layout";
import type { GraphSettings } from "../../../../editor/settings";

export class GraphCanvasRenderer {
	private edges = new EdgeRenderer();

	public render(graph: Graph, editor: GraphEditor, canvas: HTMLCanvasElement, layout: GraphLayout, settings: GraphSettings): void {
		const rect = canvas.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		const width = Math.round(rect.width * dpr);
		const height = Math.round(rect.height * dpr);

		if (canvas.width !== width)
			canvas.width = width;

		if (canvas.height !== height)
			canvas.height = height;

		const ctx = canvas.getContext("2d");

		if (!ctx)
			return;

		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.save();
		ctx.setTransform(dpr * graph.scale, 0, 0, -dpr * graph.scale, dpr * (rect.width / 2 + graph.offset.x), dpr * (rect.height / 2 - graph.offset.y));
		ctx.lineWidth = settings.lineWidth;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.strokeStyle = "white";

		this.edges.render(graph, editor, layout, ctx, settings);
		ctx.restore();
	}

	public getIntersectingEdges(graph: Graph, layout: GraphLayout, canvas: HTMLCanvasElement, start: Vec2, end: Vec2): NodeEdge[] {
		return this.edges.getIntersectingEdges(graph, layout, canvas, start, end);
	}

	public clear(): void {
		this.edges.clear();
	}
}
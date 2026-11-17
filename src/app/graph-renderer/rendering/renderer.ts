import { Graph } from "../../../graph";
import { EdgeRenderer } from "./edge-renderer";
import { GraphLayout } from "./graph-layout";

export class GraphCanvasRenderer {
	private edges = new EdgeRenderer();

	public render(graph: Graph, canvas: HTMLCanvasElement, layout: GraphLayout): void {
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

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.save();

		ctx.setTransform(
			dpr * graph.scale,
			0,
			0,
			-dpr * graph.scale,
			dpr * (rect.width / 2 + graph.offset.x),
			dpr * (rect.height / 2 - graph.offset.y)
		);

		ctx.lineWidth = 1 / graph.scale;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.strokeStyle = "white";

		this.edges.render(graph, layout, ctx);

		if (graph.slice) {
			const start = graph.getCanvasMousePosition(graph.slice.downPos, canvas);
			const end = graph.getCanvasMousePosition(graph.slice.mousePos, canvas);

			ctx.strokeStyle = "red";
			ctx.beginPath();
			ctx.moveTo(start.x, start.y);
			ctx.lineTo(end.x, end.y);
			ctx.stroke();
		}

		ctx.restore();
	}

	public clear(): void {
		this.edges.clear();
	}
}

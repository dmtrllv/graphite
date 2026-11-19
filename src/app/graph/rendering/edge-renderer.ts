import { Vec2, type GraphEditor, type Graph, type NodeEdge } from "@editor";
import { EdgeGeometryCache } from "./edge-geometry";
import { GraphLayout } from "./graph-layout";
import type { GraphSettings } from "../../../editor/settings";

export class EdgeRenderer {
	private geometry = new EdgeGeometryCache();

	public render(graph: Graph, editor: GraphEditor, layout: GraphLayout, ctx: CanvasRenderingContext2D, settings: GraphSettings): void {
		this.geometry.retain(graph.edges.values());

		for (const edge of graph.edges.values())
			this.renderEdge(edge, layout, ctx, settings);

		if (editor.draggingEdge)
			this.renderDraggingEdge(graph, editor.draggingEdge, layout, ctx, settings);

		if (editor.edgeCut) {
			const start = graph.getCanvasMousePosition(editor.edgeCut.downPos, ctx.canvas);
			const end = graph.getCanvasMousePosition(editor.edgeCut.mousePos, ctx.canvas);

			ctx.strokeStyle = "red";
			ctx.beginPath();
			ctx.moveTo(start.x, start.y);
			ctx.lineTo(end.x, end.y);
			ctx.stroke();
		}
	}

	public getIntersectingEdges(graph: Graph, layout: GraphLayout, canvas: HTMLCanvasElement, start: Vec2, end: Vec2): NodeEdge[] {
		const a = graph.getCanvasMousePosition(start, canvas);
		const b = graph.getCanvasMousePosition(end, canvas);
		const result: NodeEdge[] = [];

		for (const edge of graph.edges.values()) {
			const geometry = this.geometry.get(edge, layout);

			if (!geometry)
				continue;

			let previous = geometry.start;
			let intersects = false;

			for (let i = 1; i <= 32; i++) {
				const t = i / 32;
				const inverse = 1 - t;
				const point = new Vec2(
					inverse ** 3 * geometry.start.x +
					3 * inverse ** 2 * t * geometry.controlStart.x +
					3 * inverse * t ** 2 * geometry.controlEnd.x +
					t ** 3 * geometry.end.x,
					inverse ** 3 * geometry.start.y +
					3 * inverse ** 2 * t * geometry.controlStart.y +
					3 * inverse * t ** 2 * geometry.controlEnd.y +
					t ** 3 * geometry.end.y
				);

				if (this.intersects(a, b, previous, point)) {
					intersects = true;
					break;
				}

				previous = point;
			}

			if (intersects)
				result.push(edge);
		}

		return result;
	}

	public removeEdge(edge: NodeEdge): void {
		this.geometry.remove(edge);
	}

	public clear(): void {
		this.geometry.clear();
	}

	private renderEdge(edge: NodeEdge, layout: GraphLayout, ctx: CanvasRenderingContext2D, settings: GraphSettings): void {
		const geometry = this.geometry.get(edge, layout);

		if (!geometry)
			return;

		const sourceKind = edge.source.getPropKind(edge.sourceOutput);
		const targetKind = edge.target.getPropKind(edge.targetInput);

		const gradient = ctx.createLinearGradient(geometry.start.x, geometry.start.y, geometry.end.x, geometry.end.y);

		gradient.addColorStop(0, this.getEdgeColor(sourceKind ?? ""));
		gradient.addColorStop(1, this.getEdgeColor(targetKind ?? ""));

		ctx.strokeStyle = gradient;

		const curve = Math.max(0, Math.min(1, settings.curve));
		const controlStart = new Vec2(
			geometry.start.x + (geometry.controlStart.x - geometry.start.x) * curve,
			geometry.start.y + (geometry.controlStart.y - geometry.start.y) * curve
		);
		const controlEnd = new Vec2(
			geometry.end.x + (geometry.controlEnd.x - geometry.end.x) * curve,
			geometry.end.y + (geometry.controlEnd.y - geometry.end.y) * curve
		);

		ctx.beginPath();
		ctx.moveTo(geometry.start.x, geometry.start.y);
		ctx.bezierCurveTo(controlStart.x, controlStart.y, controlEnd.x, controlEnd.y, geometry.end.x, geometry.end.y);
		ctx.stroke();
	}

	private renderDraggingEdge(graph: Graph, edge: NonNullable<GraphEditor["draggingEdge"]>, layout: GraphLayout, ctx: CanvasRenderingContext2D, settings: GraphSettings): void {
		const port = layout.getPort(edge.node, edge.from, edge.key);

		if (!port)
			return;

		const mouse = graph.getCanvasMousePosition(edge.mousePosition, ctx.canvas);
		const kind = edge.node.getPropKind(edge.key);

		ctx.strokeStyle = this.getEdgeColor(kind ?? "");
		ctx.beginPath();
		ctx.moveTo(port.position.x, port.position.y);

		const curve = Math.max(0, Math.min(1, settings.curve));
		const tangent = Math.max(40, Math.abs(mouse.x - port.position.x) * 0.5) * curve;

		if (edge.from === "output")
			ctx.bezierCurveTo(port.position.x + tangent, port.position.y, mouse.x - tangent, mouse.y, mouse.x, mouse.y);
		else
			ctx.bezierCurveTo(port.position.x - tangent, port.position.y, mouse.x + tangent, mouse.y, mouse.x, mouse.y);

		ctx.stroke();
	}

	private intersects(a: Vec2, b: Vec2, c: Vec2, d: Vec2): boolean {
		const cross = (p: Vec2, q: Vec2, r: Vec2) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
		const abC = cross(a, b, c);
		const abD = cross(a, b, d);
		const cdA = cross(c, d, a);
		const cdB = cross(c, d, b);

		return abC * abD <= 0 && cdA * cdB <= 0;
	}

	private getEdgeColor(kind: string): string {
		switch (kind) {
			case "vector": return "#56B6C2";
			case "scalar": return "#E5A45B";
			case "texture": return "#62b64d";
			case "sampler": return "#d46363";
		}

		return "white";
	}
}
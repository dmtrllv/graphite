import { Vec2 } from "../types";
import type { Graph } from "../graph";
import type { GraphEditor } from "../editor";
import type { NodeEdge } from "../edge";
import { GraphNode } from "../nodes";
import { EdgeGeometryCache } from "./edge-geometry";
import { GraphLayout } from "./graph-layout";
import type { GraphSettings } from "../../settings";

export class EdgeRenderer {
	private geometry = new EdgeGeometryCache();

	public sync(graph: Graph): void {
		this.geometry.retain(graph.edges.values());
	}

	public renderEdges(edges: Iterable<NodeEdge>, layout: GraphLayout, ctx: CanvasRenderingContext2D, settings: GraphSettings, filter?: (edge: NodeEdge) => boolean): number {
		let count = 0;

		for (const edge of edges) {
			if (filter && !filter(edge))
				continue;

			this.renderEdge(edge, layout, ctx, settings);
			count++;
		}

		return count;
	}

	public renderInteractive(editor: GraphEditor, layout: GraphLayout, ctx: CanvasRenderingContext2D, settings: GraphSettings): void {
		if (editor.draggingEdge)
			this.renderDraggingEdge(editor, editor.draggingEdge, layout, ctx, settings);

		if (editor.edgeCut) {
			const start = editor.getCanvasMousePosition(editor.edgeCut.downPos, ctx.canvas);
			const end = editor.getCanvasMousePosition(editor.edgeCut.mousePos, ctx.canvas);

			ctx.strokeStyle = "red";
			ctx.beginPath();
			ctx.moveTo(start.x, start.y);
			ctx.lineTo(end.x, end.y);
			ctx.stroke();
		}
	}

	public getIntersectingEdges(graph: Graph, editor: GraphEditor, layout: GraphLayout, canvas: HTMLCanvasElement, start: Vec2, end: Vec2): NodeEdge[] {
		const a = editor.getCanvasMousePosition(start, canvas);
		const b = editor.getCanvasMousePosition(end, canvas);
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

	public clear(): void {
		this.geometry.clear();
	}

	private renderEdge(edge: NodeEdge, layout: GraphLayout, ctx: CanvasRenderingContext2D, settings: GraphSettings): void {
		const geometry = this.geometry.get(edge, layout);

		if (!geometry)
			return;

		const sourceKind = GraphNode.getPort(edge.source, edge.sourceOutput, "output")?.value.kind;
		const targetKind = GraphNode.getPort(edge.target, edge.targetInput, "input")?.value.kind;
		const gradient = ctx.createLinearGradient(geometry.start.x, geometry.start.y, geometry.end.x, geometry.end.y);

		gradient.addColorStop(0, this.getEdgeColor(settings, sourceKind ?? ""));
		gradient.addColorStop(1, this.getEdgeColor(settings, targetKind ?? ""));
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

	private renderDraggingEdge(editor: GraphEditor, edge: NonNullable<GraphEditor["draggingEdge"]>, layout: GraphLayout, ctx: CanvasRenderingContext2D, settings: GraphSettings): void {
		const port = layout.getPort(edge.node, edge.from, edge.key);

		if (!port)
			return;

		const mouse = editor.getCanvasMousePosition(edge.mousePosition, ctx.canvas);
		const kind = GraphNode.getPort(edge.node, edge.key, edge.from)?.value.kind;

		ctx.strokeStyle = this.getEdgeColor(settings, kind ?? "");
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

	private getEdgeColor(settings: GraphSettings, kind: string): string {
		switch(kind) {
			case "scalar": return settings.scalarColor;
			case "vector": return settings.vectorColor;
			default: return "pink";
		}
	}
}
import type { Graph, GraphNode, NodeEdge, DraggingEdge } from "../../../graph";
import { EdgeGeometryCache } from "./edge-geometry";
import { GraphLayout } from "./graph-layout";

export class EdgeRenderer {
	private geometry = new EdgeGeometryCache();

	public render(graph: Graph, layout: GraphLayout, ctx: CanvasRenderingContext2D): void {
		this.geometry.retain(graph.edges.values());

		for (const edge of graph.edges.values())
			this.renderEdge(edge, layout, ctx);

		if (graph.draggingEdge)
			this.renderDraggingEdge(graph, graph.draggingEdge, layout, ctx);
	}

	public removeEdge(edge: NodeEdge): void {
		this.geometry.remove(edge);
	}

	public clear(): void {
		this.geometry.clear();
	}

	private renderEdge(edge: NodeEdge, layout: GraphLayout, ctx: CanvasRenderingContext2D): void {
		const geometry = this.geometry.get(edge, layout);

		if (!geometry)
			return;

		const sourceKind = edge.source.getPropKind(edge.sourceOutput);
		const targetKind = edge.target.getPropKind(edge.targetInput);

		const gradient = ctx.createLinearGradient(
			geometry.start.x,
			geometry.start.y,
			geometry.end.x,
			geometry.end.y
		);

		gradient.addColorStop(0, this.getEdgeColor(sourceKind ?? ""));
		gradient.addColorStop(1, this.getEdgeColor(targetKind ?? ""));

		ctx.strokeStyle = gradient;
		ctx.beginPath();
		ctx.moveTo(geometry.start.x, geometry.start.y);
		ctx.bezierCurveTo(
			geometry.controlStart.x,
			geometry.controlStart.y,
			geometry.controlEnd.x,
			geometry.controlEnd.y,
			geometry.end.x,
			geometry.end.y
		);
		ctx.stroke();
	}

	private renderDraggingEdge(graph: Graph, edge: DraggingEdge<GraphNode>, layout: GraphLayout, ctx: CanvasRenderingContext2D): void {
		const direction = edge.from;
		const port = layout.getPort(edge.node, direction, edge.key.toString());

		if (!port)
			return;

		const mouse = graph.getCanvasMousePosition(edge.mousePosition, ctx.canvas);
		const kind = edge.node.getPropKind(edge.key.toString());

		ctx.strokeStyle = this.getEdgeColor(kind ?? "");
		ctx.beginPath();
		ctx.moveTo(port.position.x, port.position.y);

		const tangent = Math.max(40, Math.abs(mouse.x - port.position.x) * 0.5);

		if (direction === "output") {
			ctx.bezierCurveTo(
				port.position.x + tangent,
				port.position.y,
				mouse.x - tangent,
				mouse.y,
				mouse.x,
				mouse.y
			);
		} else {
			ctx.bezierCurveTo(
				port.position.x - tangent,
				port.position.y,
				mouse.x + tangent,
				mouse.y,
				mouse.x,
				mouse.y
			);
		}

		ctx.stroke();
	}

	private getEdgeColor(kind: string): string {
		switch (kind) {
			case "vector":
				return "#56B6C2";
			case "scalar":
				return "#E5A45B";
			case "texture":
				return "#62b64d";
			case "sampler":
				return "#d46363";
		}

		return "white";
	}
}

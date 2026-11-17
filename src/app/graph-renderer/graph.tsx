import { NodeEdge, Vec2, type DraggingEdge, type Graph } from "../../graph";
import { assert, mapChildren } from "../../utils";
import { GraphNodeView } from "./node";
import { useEvent, useMouseMove } from "../../hooks";
import { useEffect, useMemo, useRef } from "react";
import { subscribe, useObservable } from "../../reactive";
import { useResizeObserver } from "../../hooks/resize";

import "./graph.scss";

export const GraphRenderer = ({ graph }: { graph: Graph }) => {
	useObservable(graph);

	const { onMouseDown } = useMouseMove(graph.offset, val => graph.offset.set(val), 1, true);

	const style = useMemo<React.CSSProperties>(() => {
		return {
			left: `calc(50% + ${graph.offset.x}px)`,
			top: `calc(50% + ${-graph.offset.y}px)`,
			transform: `translate(-50%, -50%) scale(${graph.scale})`
		}
	}, [graph.offset.x, graph.offset.y, graph.scale]);

	const { canvas } = useRenderer(graph);

	const onWheel = (e: React.WheelEvent) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const mouse = new Vec2(e.clientX - rect.left - rect.width / 2, -(e.clientY - rect.top - rect.height / 2));

		const scale = graph.scale;
		const nextScale = scale - scale * (e.deltaY / 1000) * 0.25;
		const ratio = nextScale / scale;

		graph.offset.x = mouse.x - (mouse.x - graph.offset.x) * ratio;
		graph.offset.y = mouse.y - (mouse.y - graph.offset.y) * ratio;
		graph.scale = nextScale;
	};

	return (
		<div className="graph-renderer" onMouseDown={onMouseDown} onWheel={onWheel}>
			<canvas ref={canvas} />
			<div className="graph" style={style}>
				{mapChildren(graph.nodes, (k, v) => <GraphNodeView key={k} node={v} />)}
			</div>
		</div>
	);
};

const useRenderer = (graph: Graph) => {
	const canvas = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!canvas.current)
			return;

		const c = canvas.current;

		render(graph, c);

		return subscribe(graph, ["nodes", "edges", "offset", "scale"], { recursive: true }, () => render(graph, c));
	}, []);

	useEvent("mousemove", (e) => {
		if (canvas.current && graph.draggingEdge) {
			graph.draggingEdge.mousePosition.set({ x: e.clientX, y: e.clientY });
			render(graph, canvas.current);
		}
	});

	useResizeObserver(() => {
		if (canvas.current)
			render(graph, canvas.current);
	}, canvas);

	return {
		canvas
	};
};

const POINT_OFFSETS = [8, 2] as const;

const getIOPointPosition = (graph: Graph, el: HTMLElement, canvas: HTMLCanvasElement, pointOffset: 0 | 1) => {
	const c = canvas.getBoundingClientRect();
	const e = el.getBoundingClientRect();

	return new Vec2(
		(e.x - c.x - graph.offset.x - (c.width / 2)) + (POINT_OFFSETS[pointOffset]! * graph.scale),
		((e.y - c.y) + graph.offset.y - (c.height / 2)) + (7.5 * graph.scale),
	);
};

const getCanvasMousePosition = (graph: Graph, position: Vec2, canvas: HTMLCanvasElement) => {
	const c = canvas.getBoundingClientRect();

	return new Vec2(
		position.x - c.x - graph.offset.x - (c.width / 2),
		-(-(position.y - c.y) - graph.offset.y + (c.height / 2)),
	);
};

const render = (graph: Graph, canvas: HTMLCanvasElement) => requestAnimationFrame(() => draw(graph, canvas));

const draw = (graph: Graph, canvas: HTMLCanvasElement) => {
	canvas.width = canvas.parentElement!.clientWidth;
	canvas.height = canvas.parentElement!.clientHeight;

	const ctx = assert.notNull(canvas.getContext("2d"));

	ctx.save();
	ctx.translate(graph.offset.x + (canvas.width / 2), -graph.offset.y + (canvas.height / 2));
	ctx.fillStyle = "white";
	ctx.strokeStyle = "white";
	ctx.stroke();
	ctx.lineWidth = graph.scale;

	if (graph.draggingEdge) {
		renderDraggingEdge(graph, graph.draggingEdge, ctx);
	}

	for (const [, edge] of graph.edges) {
		renderEdge(graph, edge, ctx);
	}

	ctx.scale(graph.scale, graph.scale);
};

const renderDraggingEdge = (graph: Graph, edge: DraggingEdge<any>, ctx: CanvasRenderingContext2D) => {
	const canvas = ctx.canvas;

	let target: HTMLElement | undefined | null = null;

	if (edge.from === "input") {
		target = edge.node.inputElements[edge.key];
	} else {
		target = edge.node.outputElements[edge.key];
	}

	if (!target) {
		console.error(`Could not get ${edge.from} html element of ${edge.node.name}.${edge.key.toString()}!`);
		return;
	}

	const position = getIOPointPosition(graph, target, canvas, edge.from === "input" ? 0 : 1);
	const mousePos = getCanvasMousePosition(graph, edge.mousePosition, canvas);

	ctx.beginPath();
	ctx.moveTo(position.x, position.y);
	ctx.lineTo(mousePos.x, mousePos.y);
	ctx.stroke();
};

const renderEdge = (graph: Graph, edge: NodeEdge, ctx: CanvasRenderingContext2D) => {
	const canvas = ctx.canvas;
	const output = edge.source.outputElements[edge.sourceOutput];
	const input = edge.target.inputElements[edge.targetInput];

	if (!output || !input) {
		return console.error(`missing io elements`);
	}

	const inPos = getIOPointPosition(graph, output, canvas, 1);
	const outPos = getIOPointPosition(graph, input, canvas, 0);

	const sourceProp = edge.source[edge.sourceOutput as keyof typeof edge.source] as any;
	const targetProp = edge.target[edge.targetInput as keyof typeof edge.target] as any;

	const grad = ctx.createLinearGradient(inPos.x, inPos.y, outPos.x, outPos.y);

	switch (sourceProp.kind) {
		case "vector":
			grad.addColorStop(0, "#56B6C2");
			break;
		case "scalar":
			grad.addColorStop(0, "#E5A45B");
			break;
		case "texture":
			grad.addColorStop(1, "#62b64d");
			break;
		case "sampler":
			grad.addColorStop(1, "#d46363");
			break;
	}

	switch (targetProp.kind) {
		case "vector":
			grad.addColorStop(1, "#56B6C2");
			break;
		case "scalar":
			grad.addColorStop(1, "#E5A45B");
			break;
		case "texture":
			grad.addColorStop(1, "#62b64d");
			break;
		case "sampler":
			grad.addColorStop(1, "#d46363");
			break;
	}

	ctx.strokeStyle = grad;
	ctx.beginPath();
	ctx.moveTo(inPos.x, inPos.y);
	ctx.lineTo(outPos.x, outPos.y);
	ctx.stroke();
};
import { Graph, GraphNode, NodeEdge, Selection, Slice, Vec2, type DraggingEdge } from "../../graph";
import { assert, mapChildren, stopPropagation } from "../../utils";
import { GraphNodeView } from "./node";
import { useEvent, useMouseMove } from "../../hooks";
import { useEffect, useMemo, useRef } from "react";
import { subscribe, useObservable } from "../../reactive";
import { useResizeObserver } from "../../hooks/resize";

import "./graph.scss";

const getSelectionStyle = (graph: Graph): React.CSSProperties => {
	const style: React.CSSProperties = {};

	if (!graph.selection)
		return style;

	const d = graph.selection.downPos;
	const m = graph.selection.mousePos;

	style.left = Math.min(d.x, m.x);
	style.top = Math.min(d.y, m.y);
	style.width = Math.max(d.x, m.x) - Math.min(d.x, m.x);
	style.height = Math.max(d.y, m.y) - Math.min(d.y, m.y);
	style.border = `1px solid red`;
	style.backgroundColor = `rgba(255, 0, 0, 0.3)`;
	style.position = "absolute";

	return style;
}

export const GraphRenderer = ({ graph }: { graph: Graph }) => {
	useObservable(graph, { recursive: true });

	const animationFrame = useRef<any>(null);

	const renderGraph = () => {
		if (animationFrame.current)
			cancelAnimationFrame(animationFrame.current);
		if (canvas.current)
			render(graph, canvas.current);
	}

	const { showContextMenu } = useObservable({
		showContextMenu: false
	});

	const mouseMove = useMouseMove(graph.offset, val => graph.offset.set(val), 1, true, 1);

	const style = useMemo<React.CSSProperties>(() => {
		return {
			left: `calc(50% + ${graph.offset.x}px)`,
			top: `calc(50% + ${-graph.offset.y}px)`,
			transform: `translate(-50%, -50%) scale(${graph.scale})`
		}
	}, [graph.offset.x, graph.offset.y, graph.scale]);

	const selectionStyle = getSelectionStyle(graph)

	const canvas = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!canvas.current)
			return;

		const c = canvas.current;

		renderGraph();

		return subscribe(graph as any, ["nodes", "edges", "offset", "scale"], { recursive: true }, renderGraph);
	}, []);

	useEvent("mousemove", (e) => {
		if (canvas.current) {
			if (graph.draggingEdge) {
				graph.draggingEdge.mousePosition.set({ x: e.clientX, y: e.clientY });
				renderGraph();
			} else if (graph.slice) {
				graph.slice.mousePos = new Vec2(e.clientX, e.clientY);
				renderGraph();
			}
		}
	});

	useResizeObserver(() => {
		renderGraph();
	}, canvas);

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

	const onMouseDown = (e: React.MouseEvent) => {
		mouseMove.onMouseDown(e);
		if (e.button === 0)
			graph.selection = new Selection(new Vec2(e.clientX, e.clientY), new Vec2(e.clientX, e.clientY));
		if (e.button === 2)
			graph.slice = new Slice(new Vec2(e.clientX, e.clientY), new Vec2(e.clientX, e.clientY));
	};

	useEvent("mousemove", (e) => {
		e.preventDefault();
		if (e.button === 0) {
			if (!graph.selection || !canvas.current)
				return;
			graph.updateSelection(new Vec2(e.clientX, e.clientY), canvas.current);
		}
	});

	useEvent("mouseup", (e) => {
		if (e.button === 0) {
			if (!graph.selection)
				return;

			const a = graph.selection.mousePos;
			const b = graph.selection.downPos;

			if (a.distance(b) === 0)
				graph.selectedNodes = [];


			graph.selection = null;
		} else if (e.button === 2) {
			graph.cutEdges();
		}
	});

	return (
		<div className="graph-renderer" onMouseDown={onMouseDown} onWheel={onWheel} onContextMenu={e => e.preventDefault()} >
			<canvas ref={canvas} />
			<div className="graph" style={style}>
				{mapChildren(graph.nodes, (k, v) => <GraphNodeView key={k} node={v} />)}
			</div>
			<div className="selection" style={selectionStyle} />
			<div className={`context-menu ${showContextMenu && "show"}`} onMouseDown={stopPropagation}>
				<input type="text" placeholder="Add" />
				{mapChildren(GraphNode.getRegisteredNodes(), (key, val) => {
					return (
						<button className="node-option" style={{ pointerEvents: "auto" }} key={key} onClick={() => graph.addNode(val)}>
							{key}
						</button>
					);
				})}
			</div>
		</div>
	);
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

const render = (graph: Graph, canvas: HTMLCanvasElement) => requestAnimationFrame(() => draw(graph, canvas));

const draw = (graph: Graph, canvas: HTMLCanvasElement) => {
	canvas.width = canvas.parentElement!.clientWidth;
	canvas.height = canvas.parentElement!.clientHeight;

	const ctx = assert.notNull(canvas.getContext("2d"));

	ctx.save();
	ctx.translate(graph.offset.x + (canvas.width / 2), -graph.offset.y + (canvas.height / 2));
	ctx.fillStyle = "white";
	ctx.strokeStyle = "white";
	ctx.lineWidth = graph.scale;

	if (graph.draggingEdge) {
		renderDraggingEdge(graph, graph.draggingEdge, ctx);
	}

	for (const [, edge] of graph.edges) {
		renderEdge(graph, edge, ctx);
	}

	if (graph.slice) {
		ctx.strokeStyle = "red";
		ctx.beginPath();
		const d = graph.getCanvasMousePosition(graph.slice.downPos, canvas);
		const m = graph.getCanvasMousePosition(graph.slice.mousePos, canvas);
		ctx.moveTo(d.x, -d.y);
		ctx.lineTo(m.x, -m.y);
		ctx.stroke();
	}

	ctx.scale(graph.scale, graph.scale);
};

const renderDraggingEdge = (graph: Graph, edge: DraggingEdge<GraphNode>, ctx: CanvasRenderingContext2D) => {
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
	const mousePos = graph.getCanvasMousePosition(edge.mousePosition, canvas);

	const kind = edge.node.getPropKind(edge.key);
	ctx.strokeStyle = kind ? getEdgeColor(kind) : "white";
	ctx.beginPath();
	ctx.moveTo(position.x, position.y);
	ctx.lineTo(mousePos.x, -mousePos.y);
	ctx.stroke();
};

const getEdgeColor = (kind: string) => {
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

	grad.addColorStop(0, getEdgeColor(sourceProp.kind));
	grad.addColorStop(1, getEdgeColor(targetProp.kind));

	ctx.strokeStyle = grad;
	ctx.beginPath();
	ctx.moveTo(inPos.x, inPos.y);
	ctx.lineTo(outPos.x, outPos.y);
	ctx.stroke();
};
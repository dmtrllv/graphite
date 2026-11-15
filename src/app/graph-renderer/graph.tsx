import { type Graph } from "../../graph";
import { assert, mapChildren } from "../../utils";
import { GraphNodeView } from "./node";
import { useMouseMove } from "../../hooks";
import { useEffect, useMemo, useRef } from "react";
import { subscribe, useObservable } from "../../reactive";

import "./graph.scss";

export const GraphRenderer = ({ graph }: { graph: Graph }) => {
	useObservable(graph);

	const { onMouseDown } = useMouseMove(graph.offset, val => graph.offset.set(val), true);

	const style = useMemo<React.CSSProperties>(() => {
		return {
			left: `calc(50% + ${graph.offset.x}px)`,
			top: `calc(50% + ${-graph.offset.y}px)`,
			transform: `translate(-50%, -50%) scale(${graph.scale})`
		}
	}, [graph.offset.x, graph.offset.y, graph.scale]);

	const { canvas } = useRenderer(graph);

	const onWheel = (e: React.WheelEvent) => {
		graph.scale += e.deltaY / 10000;
	} 

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

		return subscribe(graph, ["nodes", "edges"], { recursive: true }, () => render(graph, c));
	}, [graph.offset.x, graph.offset.y, graph.scale]);

	return {
		canvas
	};
};

const render = (graph: Graph, canvas: HTMLCanvasElement) => {
	canvas.width = canvas.parentElement!.clientWidth;
	canvas.height = canvas.parentElement!.clientHeight;
	
	const ctx = assert.notNull(canvas.getContext("2d"));
	
	ctx.save();
	ctx.translate(graph.offset.x + (canvas.width / 2), -graph.offset.y + (canvas.height / 2));
	ctx.scale(graph.scale, graph.scale);
	ctx.fillStyle = "white"
	ctx.fillRect(0, 0, 100, 100);
	ctx.stroke();
}
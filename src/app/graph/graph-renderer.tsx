import { Graph, GraphNode, Selection, EdgeSlice, Vec2 } from "../../graph";
import { mapChildren, stopPropagation } from "../../utils";
import { GraphNodeView } from "./node";
import { useEvent, useMouseMove } from "../../hooks";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { subscribe, useObservable } from "../../reactive";
import { useResizeObserver } from "../../hooks/resize";
import { GraphCanvasRenderer, GraphLayout, RenderScheduler } from "./rendering";

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

	const canvas = useRef<HTMLCanvasElement>(null);

	const layout = useMemo(() => new GraphLayout(), [graph]);
	const renderer = useMemo(() => new GraphCanvasRenderer(), [graph]);

	const scheduler = useMemo(() => {
		return new RenderScheduler(() => {
			if (canvas.current)
				renderer.render(graph, canvas.current, layout);
		});
	}, [graph, layout, renderer]);

	const invalidate = useCallback(() => {
		scheduler.invalidate();
	}, [scheduler]);

	const updateNodeLayout = useCallback((node: GraphNode) => {
		if (!canvas.current)
			return;

		layout.updateNode(node, graph, canvas.current);
		invalidate();
	}, [graph, layout, invalidate]);

	const removeNodeLayout = useCallback((node: GraphNode) => {
		layout.removeNode(node);
		invalidate();
	}, [layout, invalidate]);

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

	const selectionStyle = getSelectionStyle(graph);

	useEffect(() => {
		const unsubscriber = subscribe(graph, { recursive: true }, invalidate);

		invalidate();

		return () => {
			unsubscriber();
			scheduler.dispose();
			renderer.clear();
		};
	}, [graph, invalidate, scheduler, renderer]);

	useEvent("mousemove", (e) => {
		if (graph.draggingEdge) {
			graph.draggingEdge.mousePosition.set({ x: e.clientX, y: e.clientY });
			invalidate();
		} else if (graph.slice) {
			graph.slice.mousePos = new Vec2(e.clientX, e.clientY);
			invalidate();
		}
	});

	useResizeObserver(() => {
		invalidate();
	}, canvas);

	const onWheel = (e: React.WheelEvent) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const mouse = new Vec2(
			e.clientX - rect.left - rect.width / 2,
			-(e.clientY - rect.top - rect.height / 2)
		);

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
			graph.slice = new EdgeSlice(new Vec2(e.clientX, e.clientY), new Vec2(e.clientX, e.clientY));
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
		<div className="graph-renderer" onMouseDown={onMouseDown} onWheel={onWheel} onContextMenu={e => e.preventDefault()}>
			<canvas ref={canvas} />
			<div className="graph" style={style}>
				{mapChildren(graph.nodes, (k, v) => (
					<GraphNodeView
						key={k}
						node={v}
						onLayoutChange={updateNodeLayout}
						onLayoutRemove={removeNodeLayout}
					/>
				))}
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

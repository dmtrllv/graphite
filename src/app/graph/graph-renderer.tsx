import { GraphNode, Vec2 } from "../../graph";
import type { GraphEditor } from "../../graph/editor";
import { CutEdgesTool, SelectTool, type GraphPointerEvent } from "../../graph/tools";
import { mapChildren } from "../../utils";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { subscribe } from "../../reactive";
import { GraphNodeView } from "./node";
import { GraphRendererStore } from "./rendering";

import "./graph.scss";

const getSelectionStyle = (editor: GraphEditor): React.CSSProperties => {
	const style: React.CSSProperties = {};
	const selection = editor.selection;

	if (!selection)
		return style;

	const d = selection.downPos;
	const m = selection.mousePos;

	style.left = Math.min(d.x, m.x);
	style.top = Math.min(d.y, m.y);
	style.width = Math.abs(d.x - m.x);
	style.height = Math.abs(d.y - m.y);
	style.border = "1px solid red";
	style.backgroundColor = "rgba(255, 0, 0, 0.3)";
	style.position = "absolute";
	style.pointerEvents = "none";

	return style;
};

export const GraphRenderer = ({ editor }: { editor: GraphEditor }) => {
	const graph = editor.graph;
	const root = useRef<HTMLDivElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);
	const pan = useRef<{ pointerId: number; x: number; y: number } | null>(null);
	const [structureVersion, setStructureVersion] = useState(graph.structureVersion);
	const [editorVersion, setEditorVersion] = useState(0);
	const [graphVersion, setGraphVersion] = useState(0);
	const store = useMemo(() => new GraphRendererStore(editor), [editor]);
	const layout = store.layout;

	const invalidate = useCallback(() => store.invalidate(), [store]);

	const updateNodeLayout = useCallback((node: GraphNode) => {
		store.updateNode(node);
	}, [store]);

	const selectTool = useMemo(() => new SelectTool(editor, layout), [editor, layout]);

	const cutTool = useMemo(() => new CutEdgesTool(editor, (start, end) => {
		const canvasElement = canvas.current;

		if (!canvasElement)
			return [];

		return store.renderer.getIntersectingEdges(graph, layout, canvasElement, start, end);
	}), [editor, graph, layout, store]);

	const style = useMemo<React.CSSProperties>(() => ({
		left: `calc(50% + ${graph.offset.x}px)`,
		top: `calc(50% + ${-graph.offset.y}px)`,
		transform: `translate(-50%, -50%) scale(${graph.scale})`
	}), [graph.offset.x, graph.offset.y, graph.scale]);

	const selectionStyle = getSelectionStyle(editor);

	useEffect(() => {
		const element = canvas.current;

		if (!element)
			return;

		store.attach(element);

		return () => store.detach();
	}, [store]);

	useEffect(() => {
		const unsubscribers = [
			subscribe(graph, "structureVersion", () => {
				setStructureVersion(graph.structureVersion);
			}),
			subscribe(graph, "offset", { recursive: true }, () => {
				setGraphVersion(version => version + 1);
				invalidate();
			}),
			subscribe(graph, "scale", () => {
				setGraphVersion(version => version + 1);
				invalidate();
			}),
			subscribe(editor, "selectedNodes", { recursive: true }, () => setEditorVersion(version => version + 1)),
			subscribe(editor, "selection", { recursive: true }, () => {
				setEditorVersion(version => version + 1);
				invalidate();
			})
		];

		return () => {
			for (const unsubscribe of unsubscribers)
				unsubscribe();
		};
	}, [graph, editor, invalidate]);

	useLayoutEffect(() => {
		const element = canvas.current;

		if (!element)
			return;

		layout.updateAll(graph, element);
		invalidate();
	}, [graphVersion, graph, layout, invalidate])

	useEffect(() => {
		editor.setTool(selectTool);
		return () => editor.setTool(null);
	}, [editor, selectTool]);

	const getPointerEvent = (event: React.PointerEvent, node?: GraphNode) => ({
		clientX: event.clientX,
		clientY: event.clientY,
		button: event.button,
		shiftKey: event.shiftKey,
		ctrlKey: event.ctrlKey,
		graphPosition: graph.getCanvasMousePosition(new Vec2(event.clientX, event.clientY), canvas.current!),
		node
	}) as GraphPointerEvent;

	const onPointerDown = (event: React.PointerEvent) => {
		if (event.button === 1) {
			event.preventDefault();
			pan.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
			root.current?.setPointerCapture(event.pointerId);
			return;
		}

		if ((event.target as HTMLElement).closest(".graph-node"))
			return;

		if (event.button === 2) {
			event.preventDefault();
			editor.setTool(cutTool);
		} else if (event.button !== 0) {
			return;
		}

		root.current?.setPointerCapture(event.pointerId);
		editor.activeTool?.pointerDown(getPointerEvent(event));
	};

	const onNodePointerDown = (event: React.PointerEvent, node: GraphNode) => {
		if (event.button !== 0)
			return;

		event.preventDefault();
		event.stopPropagation();
		root.current?.setPointerCapture(event.pointerId);
		editor.setTool(selectTool);
		editor.activeTool?.pointerDown(getPointerEvent(event, node));
	};

	const onPointerMove = (event: React.PointerEvent) => {
		const activePan = pan.current;

		if (activePan?.pointerId === event.pointerId) {
			const deltaX = event.clientX - activePan.x;
			const deltaY = event.clientY - activePan.y;

			activePan.x = event.clientX;
			activePan.y = event.clientY;

			graph.offset.x += deltaX;
			graph.offset.y -= deltaY;
			return;
		}

		if (editor.draggingEdge) {
			editor.updateEdgeDrag(new Vec2(event.clientX, event.clientY));
			layout.setHoveredPort(layout.getPortAt(event.clientX, event.clientY));
		} else {
			layout.setHoveredPort();
		}

		editor.activeTool?.pointerMove(getPointerEvent(event));
	};

	const onPointerUp = (event: React.PointerEvent) => {
		if (pan.current?.pointerId === event.pointerId) {
			pan.current = null;
			return;
		}

		const port = layout.getPortAt(event.clientX, event.clientY);

		if (editor.draggingEdge && port)
			editor.connectDraggingEdge(port.node, port.key);

		editor.activeTool?.pointerUp(getPointerEvent(event));
		editor.cancelEdgeDrag();
		layout.setHoveredPort();

		if (event.button === 2)
			editor.setTool(selectTool);
	};

	const onWheel = (event: React.WheelEvent) => {
		const rect = event.currentTarget.getBoundingClientRect();
		const mouse = new Vec2(
			event.clientX - rect.left - rect.width / 2,
			-(event.clientY - rect.top - rect.height / 2)
		);

		const scale = graph.scale;
		const nextScale = Math.max(0.1, Math.min(4, scale - scale * (event.deltaY / 1000) * 0.25));
		const ratio = nextScale / scale;

		graph.offset.x = mouse.x - (mouse.x - graph.offset.x) * ratio;
		graph.offset.y = mouse.y - (mouse.y - graph.offset.y) * ratio;
		graph.scale = nextScale;
	};

	useEffect(() => {
		const element = canvas.current;

		if (!element)
			return;

		const observer = new ResizeObserver(() => {
			for (const node of graph.nodes.values())
				updateNodeLayout(node);

			invalidate();
		});

		observer.observe(element);
		return () => observer.disconnect();
	}, [graph, updateNodeLayout, invalidate]);

	return (
		<div
			ref={root}
			className="graph-renderer"
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={event => {
				if (pan.current?.pointerId === event.pointerId)
					pan.current = null;

				editor.activeTool?.cancel();
				editor.cancelEdgeDrag();
				editor.setTool(selectTool);
				layout.setHoveredPort();
			}}
			onWheel={onWheel}
			onContextMenu={event => event.preventDefault()}
		>
			<canvas ref={canvas} />
			<div className="graph" style={style}>
				{mapChildren(graph.nodes, (key, node) => (
					<GraphNodeView
						key={key}
						node={node}
						editor={editor}
						layout={layout}
						selected={editor.isSelected(node)}
						onNodePointerDown={onNodePointerDown}
						onLayoutChange={updateNodeLayout}
					/>
				))}
			</div>
			<div className="selection" style={selectionStyle} data-version={editorVersion} data-structure-version={structureVersion} />
		</div>
	);
};

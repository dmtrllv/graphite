import { type GraphEditor, type Graph, type GraphLayout, Vec2, CutEdgesTool, SelectTool, type GraphPointerEvent, type GraphRendererStore, type GraphNode } from "@editor";
import { useEffect, useMemo, useRef, useState } from "react";
import React from "react";

export type NodePickerState = {
	x: number;
	y: number;
	position: Vec2;
} | null;

type GraphInteractionProps = {
	editor: GraphEditor;
	graph: Graph;
	layout: GraphLayout;
	store: GraphRendererStore;
	canvas: React.RefObject<HTMLCanvasElement | null>;
	root: React.RefObject<HTMLDivElement | null>;
	invalidate: () => void;
};

export const useGraphInteraction = ({ editor, graph, layout, store, canvas, root, invalidate }: GraphInteractionProps) => {
	const pan = useRef<{ pointerId: number; x: number; y: number } | null>(null);
	const mousePosition = useRef<Vec2 | null>(null);
	const [nodePicker, setNodePicker] = useState<NodePickerState>(null);
	const [isHovering, setHovering] = useState(false);

	const selectTool = useMemo(() => new SelectTool(editor, {
		getNodesInRect: layout.getNodesInRect.bind(layout),
		setNodeDragOffset: layout.setNodeDragOffset.bind(layout),
		beginNodeDrag: nodes => store.beginNodeDrag(nodes),
		endNodeDrag: () => store.endNodeDrag()
	}, invalidate), [editor, layout, store, invalidate]);

	const cutTool = useMemo(() => new CutEdgesTool(editor, (start, end) => {
		const element = canvas.current;

		if (!element)
			return [];

		return store.renderer.getIntersectingEdges(graph, editor, layout, element, start, end);
	}), [editor, graph, layout, store]);

	useEffect(() => {
		editor.setTool(selectTool);
		return () => editor.setTool(null);
	}, [editor, selectTool]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (!isHovering)
				return;

			const target = event.target as HTMLElement;

			if (target.closest("input, textarea, select, [contenteditable='true']"))
				return;

			if (event.ctrlKey && event.code === "Space") {
				event.preventDefault();

				const rect = root.current?.getBoundingClientRect();

				if (!rect)
					return;

				const position = mousePosition.current ?? new Vec2(rect.width / 2, rect.height / 2);
				const graphPosition = mousePosition.current ? position.clone() : new Vec2(rect.width / 2, rect.height / 2);

				setNodePicker({
					x: position.x,
					y: position.y,
					position: editor.getCanvasMousePosition(new Vec2(rect.left + graphPosition.x, rect.top + graphPosition.y), canvas.current!)
				});
				return;
			}

			if (event.key === "Escape" && nodePicker)
				setNodePicker(null);
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [editor, nodePicker, isHovering]);

	const getPointerEvent = (event: React.PointerEvent, node?: GraphNode) => ({
		clientX: event.clientX,
		clientY: event.clientY,
		button: event.button,
		shiftKey: event.shiftKey,
		ctrlKey: event.ctrlKey,
		graphPosition: editor.getCanvasMousePosition(new Vec2(event.clientX, event.clientY), canvas.current!),
		node
	}) as GraphPointerEvent;

	const onPointerDown = (event: React.PointerEvent) => {
		if (nodePicker)
			setNodePicker(null);

		if (event.button === 1) {
			event.preventDefault();
			pan.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
			(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
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

		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		editor.activeTool?.pointerDown(getPointerEvent(event));
	};

	const onNodePointerDown = (event: React.PointerEvent, node: GraphNode) => {
		if (event.button !== 0)
			return;

		event.preventDefault();
		event.stopPropagation();
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		editor.setTool(selectTool);
		editor.activeTool?.pointerDown(getPointerEvent(event, node));
	};

	const onPointerMove = (event: React.PointerEvent) => {
		if (!isHovering)
			setHovering(true);

		const rect = root.current!.getBoundingClientRect();
		mousePosition.current = new Vec2(event.clientX - rect.left, event.clientY - rect.top);

		const activePan = pan.current;

		if (activePan?.pointerId === event.pointerId) {
			const deltaX = event.clientX - activePan.x;
			const deltaY = event.clientY - activePan.y;

			activePan.x = event.clientX;
			activePan.y = event.clientY;

			editor.viewport.offset.x += deltaX;
			editor.viewport.offset.y -= deltaY;
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

	const onPointerCancel = (event: React.PointerEvent) => {
		if (pan.current?.pointerId === event.pointerId)
			pan.current = null;

		editor.activeTool?.cancel();
		editor.cancelEdgeDrag();
		editor.setTool(selectTool);
		layout.setHoveredPort();
	};

	const onWheel = (event: React.WheelEvent) => {
		const rect = event.currentTarget.getBoundingClientRect();
		const mouse = new Vec2(event.clientX - rect.left - rect.width / 2, -(event.clientY - rect.top - rect.height / 2));
		const scale = editor.viewport.scale;
		const nextScale = Math.max(0.1, Math.min(4, scale - scale * (event.deltaY / 1000) * 0.25));
		const ratio = nextScale / scale;

		editor.viewport.offset.x = mouse.x - (mouse.x - editor.viewport.offset.x) * ratio;
		editor.viewport.offset.y = mouse.y - (mouse.y - editor.viewport.offset.y) * ratio;
		editor.viewport.scale = nextScale;
		store.invalidate();
	};

	const onMouseLeave = () => setHovering(false);

	return {
		nodePicker,
		setNodePicker,
		onPointerDown,
		onNodePointerDown,
		onPointerMove,
		onPointerUp,
		onPointerCancel,
		onWheel,
		onMouseLeave
	};
};
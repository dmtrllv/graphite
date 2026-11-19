import { GraphInputNode, GraphNode, GraphNodeCategory, GraphOutputNode, SubgraphNode, Vec2 } from "../../graph";
import type { GraphEditor } from "../../graph/editor";
import { CutEdgesTool, SelectTool, type GraphPointerEvent } from "../../graph/tools";
import { mapChildren } from "../../utils";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { subscribe, useSubscribe } from "../../reactive";
import { GraphNodeView } from "./node";
import { GraphRendererStore } from "./rendering";
import type { ProjectManager } from "../../editor/project-manager";
import React from "react";

const getSelectionStyle = (editor: GraphEditor, root: HTMLDivElement | null): React.CSSProperties => {
	const style: React.CSSProperties = {};
	const selection = editor.selection;

	if (!selection || !root)
		return style;

	const rect = root.getBoundingClientRect();
	const d = selection.downPos;
	const m = selection.mousePos;

	style.left = Math.min(d.x, m.x) - rect.left;
	style.top = Math.min(d.y, m.y) - rect.top;
	style.width = Math.abs(d.x - m.x);
	style.height = Math.abs(d.y - m.y);
	style.border = "1px solid var(--accent-1)";
	style.backgroundColor = "color-mix(in srgb, var(--accent-1) 30%, transparent)";
	style.position = "absolute";
	style.pointerEvents = "none";

	return style;
};

type NodePickerState = {
	x: number;
	y: number;
	position: Vec2
} | null

type GraphRendererProps = { projectManager: ProjectManager, editor: GraphEditor, onCreateSubgraph: (editor: GraphEditor, position: Vec2) => void; };

export const GraphRenderer = ({ projectManager, editor, onCreateSubgraph }: GraphRendererProps) => {
	const graph = editor.graph;

	const root = useRef<HTMLDivElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);
	const pan = useRef<{ pointerId: number; x: number; y: number } | null>(null);
	const [structureVersion, setStructureVersion] = useState(graph.structureVersion);
	const [editorVersion, setEditorVersion] = useState(0);
	const [, setGraphVersion] = useState(0);
	const store = useMemo(() => new GraphRendererStore(editor, projectManager.activeProject.settings.graph), [editor, projectManager.activeProject]);
	const [nodePicker, setNodePicker] = useState<NodePickerState>(null);
	const mousePosition = useRef<Vec2 | null>(null);
	const nodeTypes = useMemo(() => [...GraphNode.getRegisteredNodes().entries()].filter(([name]) => !["Subgraph", "Graph Input", "Graph Output"].includes(name)).sort(([a], [b]) => a.localeCompare(b)), []);
	const [isHovering, setHovering] = useState(false);

	const layout = store.layout;

	const manager = graph.manager!;
	const [catalogVersion, setCatalogVersion] = useState(manager.catalogVersion);

	useEffect(() => {
		if (!nodePicker)
			return;

		return subscribe(manager, "catalogVersion", () => {
			setCatalogVersion(manager.catalogVersion);
		});
	}, [manager, !!nodePicker]);

	const availableSubgraphs = useMemo(() => {
		return nodePicker ? manager.getAvailableSubgraphs(graph) : [];
	}, [manager, graph, nodePicker, catalogVersion]);

	const invalidate = useCallback(() => store.invalidate(), [store]);

	const updateNodeLayout = useCallback((node: GraphNode) => {
		store.updateNode(node);
	}, [store]);

	const selectTool = useMemo(() => new SelectTool(editor, layout), [editor, layout, store]);

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

	const selectionStyle = getSelectionStyle(editor, root.current);

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
	}, [graph, layout, invalidate])

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

			if (event.ctrlKey && event.key.toLowerCase() === "z") {
				event.preventDefault();

				if (event.shiftKey)
					editor.history.redo();
				else
					editor.history.undo();

				return;
			}

			if (event.ctrlKey && event.code === "Space") {
				event.preventDefault();

				const rect = root.current?.getBoundingClientRect();
				if (!rect)
					return;

				const position = mousePosition.current ?? new Vec2(rect.width / 2, rect.height / 2);
				const graphPosition = mousePosition.current
					? position.clone()
					: new Vec2(rect.width / 2, rect.height / 2);

				setNodePicker({
					x: position.x,
					y: position.y,
					position: graph.getCanvasMousePosition(new Vec2(rect.left + graphPosition.x, rect.top + graphPosition.y), canvas.current!)
				});
				return;
			}

			if (event.key === "Escape" && nodePicker) {
				setNodePicker(null);
				return;
			}

			if (event.key === "Delete" || event.key === "Backspace") {
				if (nodePicker)
					return;

				event.preventDefault();
				editor.removeSelectedNodes();
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [editor, graph, nodePicker, isHovering]);

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

		mousePosition.current = new Vec2(event.clientX - root.current!.getBoundingClientRect().left, event.clientY - root.current!.getBoundingClientRect().top);

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
		store.invalidate();
	};

	useEffect(() => {
		const element = canvas.current;

		if (!element)
			return;

		const observer = new ResizeObserver(() => store.invalidateLayout());

		observer.observe(element);
		return () => observer.disconnect();
	}, [store]);

	const onMouseLeave = () => {
		setHovering(false);
	};

	const newSubGraph = () => {
		if (nodePicker) {
			onCreateSubgraph(editor, nodePicker.position);
			setNodePicker(null);
		}
	};

	const onPointerCancel = (event: React.PointerEvent) => {
		if (pan.current?.pointerId === event.pointerId)
			pan.current = null;

		editor.activeTool?.cancel();
		editor.cancelEdgeDrag();
		editor.setTool(selectTool);
		layout.setHoveredPort();
	};

	const definitionVersion = (node: GraphNode) => node instanceof SubgraphNode ? node.definition?.structureVersion ?? 0 : 0;

	return (
		<div ref={root} className="graph-renderer" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} onWheel={onWheel} onContextMenu={event => event.preventDefault()} onMouseLeave={onMouseLeave}>
			<canvas ref={canvas} />
			<div className="graph" style={style}>
				{mapChildren(graph.nodes, (key, node) => (
					<GraphNodeView key={`${graph.id}:${key}`} node={node} editor={editor} layout={layout} selected={editor.isSelected(node)} onNodePointerDown={onNodePointerDown} onLayoutChange={updateNodeLayout} projectManager={projectManager} definitionVersion={definitionVersion(node)} />
				))}
			</div>
			<div className="selection" style={selectionStyle} data-version={editorVersion} data-structure-version={structureVersion} />
			{
				nodePicker && (
					<div className="node-picker" style={{ left: nodePicker.x, top: nodePicker.y }} onPointerDown={event => event.stopPropagation()} onWheel={e => e.stopPropagation()}>
						{availableSubgraphs.map(definition => (
							<div key={definition.id} className="node-picker-item" onClick={() => {
								const node = editor.addNode(SubgraphNode, nodePicker.position) as SubgraphNode;
								node.graphId = definition.id;
								setNodePicker(null);
							}}>
								{definition.name}
							</div>
						))}
						{mapChildren(GraphNodeCategory, (_, category): any => {
							if (category === GraphNodeCategory.Unknown)
								return null;

							return (
								<React.Fragment key={category}>
									<div>{category}</div>
									{nodeTypes.map(([name, type]) => (type as any).category === category && (
										<div key={name} className="node-picker-item" onClick={() => {
											editor.addNode(type, nodePicker.position);
											setNodePicker(null);
										}}>
											{name}
										</div>
									))}
								</React.Fragment>
							);
						})}
						{editor.graph.inputs.length > 0 && <div>Sub Graph Inputs</div>}
						{editor.graph.inputs.map(port => (
							<div key={`input-${port.id}`} className="node-picker-item" onClick={() => {
								const node = editor.addNode(GraphInputNode, nodePicker.position) as GraphInputNode;
								node.interfaceId = port.id;
								setNodePicker(null);
							}}>
								Input: {port.name}
							</div>
						))}
						{editor.graph.outputs.length > 0 && <div>Sub Graph Outputs</div>}
						{editor.graph.outputs.map(port => (
							<div key={`output-${port.id}`} className="node-picker-item" onClick={() => {
								const node = editor.addNode(GraphOutputNode, nodePicker.position) as GraphOutputNode;
								node.interfaceId = port.id;
								setNodePicker(null);
							}}>
								Output: {port.name}
							</div>
						))}
						<div className="node-picker-item" onClick={newSubGraph}>
							New Subgraph
						</div>
					</div>
				)
			}
		</div >
	);
};
import { type GraphEditor, GraphNode, GraphRendererStore, SubgraphNode } from "@editor";
import { mapChildren } from "@utils";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { subscribe } from "@reactive";
import { GraphNodeView } from "./node";
import type { ProjectManager } from "@editor";
import { useGraphInteraction } from "./hooks";
import { NodePicker } from "./node-picker";
import { getSelectionStyle } from "./selection";

type GraphRendererProps = {
	projectManager: ProjectManager;
	editor: GraphEditor;
	onCreateSubgraph: (editor: GraphEditor, position: import("@editor").Vec2) => void;
};

export const GraphRenderer = ({ projectManager, editor, onCreateSubgraph }: GraphRendererProps) => {
	const graph = editor.graph;
	const viewport = editor.viewport;
	const root = useRef<HTMLDivElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);
	const [structureVersion, setStructureVersion] = useState(graph.structureVersion);
	const [editorVersion, setEditorVersion] = useState(0);
	const [catalogVersion, setCatalogVersion] = useState(graph.manager!.catalogVersion);
	const store = useMemo(() => new GraphRendererStore(editor, projectManager.activeProject.settings.graph), [editor, projectManager.activeProject]);
	const layout = store.layout;
	const manager = graph.manager!;

	const invalidate = useCallback(() => store.invalidate(), [store]);

	const updateNodeLayout = (node: import("@editor").GraphNode) => store.updateNode(node);

	const nodeTypes = useMemo(() => [...GraphNode.getRegisteredNodes().entries()]
		.filter(([name]) => !["Subgraph", "Graph Input", "Graph Output", "World Output", "Pass Output", "Simulation Output"].includes(name))
		.sort(([a], [b]) => a.localeCompare(b)), []);

	const interaction = useGraphInteraction({ editor, graph, layout, store, canvas, root, invalidate });

	useEffect(() => {
		if (!interaction.nodePicker)
			return;

		return subscribe(manager, event => {
			if (event.key === "catalogVersion")
				setCatalogVersion(manager.catalogVersion);
		});
	}, [manager, !!interaction.nodePicker]);

	const availableSubgraphs = useMemo(
		() => interaction.nodePicker ? manager.getAvailableSubgraphs(graph) : [],
		[manager, graph, interaction.nodePicker, catalogVersion]
	);

	useEffect(() => {
		const element = canvas.current;

		if (!element)
			return;

		store.attach(element);
		return () => store.detach();
	}, [store]);

	useEffect(() => {
		const unsubscribers = [
			subscribe(viewport, { recursive: true }, invalidate),
			subscribe(editor.selection, { recursive: true }, () => {
				setEditorVersion(version => version + 1);
				invalidate();
			}),
			subscribe(graph, event => {
				if (event.key === "structureVersion")
					setStructureVersion(graph.structureVersion);
			}),
			subscribe(editor, event => {
				if (event.key === "selectedNodes" || event.key === "selection")
					setEditorVersion(version => version + 1);
			})
		];

		return () => {
			for (const unsubscribe of unsubscribers)
				unsubscribe();
		};
	}, [graph, editor, viewport, editor.selection, store]);

	useLayoutEffect(() => {
		const element = canvas.current;

		if (!element)
			return;

		layout.updateAll(editor, element);
		invalidate();
	}, [graph, editor, layout, store]);

	const style = {
		left: `calc(50% + ${viewport.offset.x}px)`,
		top: `calc(50% + ${-viewport.offset.y}px)`,
		transform: `translate(-50%, -50%) scale(${viewport.scale})`
	};

	const selectionStyle = getSelectionStyle(editor, root.current);
	const definitionVersion = (node: GraphNode) => node instanceof SubgraphNode ? node.definition?.structureVersion ?? 0 : 0;

	return (
		<div ref={root} className="graph-renderer"
			onPointerDown={interaction.onPointerDown}
			onPointerMove={interaction.onPointerMove}
			onPointerUp={interaction.onPointerUp}
			onPointerCancel={interaction.onPointerCancel}
			onWheel={interaction.onWheel}
			onContextMenu={event => event.preventDefault()}
			onMouseLeave={interaction.onMouseLeave}>
			<canvas ref={canvas} />
			<div className="graph" style={style}>
				{mapChildren(graph.nodes, (key, node) => (
					<GraphNodeView key={`${graph.id}:${key}`} node={node} editor={editor} layout={layout}
						selected={editor.isSelected(node)}
						onNodePointerDown={interaction.onNodePointerDown}
						onLayoutChange={updateNodeLayout}
						projectManager={projectManager}
						definitionVersion={definitionVersion(node)}
					/>
				))}
			</div>
			<div className="selection" style={selectionStyle} data-version={editorVersion} data-structure-version={structureVersion} />
			{interaction.nodePicker && (
				<NodePicker
					editor={editor}
					graph={graph}
					state={interaction.nodePicker}
					nodeTypes={nodeTypes}
					availableSubgraphs={availableSubgraphs}
					onClose={() => interaction.setNodePicker(null)}
					onCreateSubgraph={onCreateSubgraph}
				/>
			)}
		</div>
	);
};
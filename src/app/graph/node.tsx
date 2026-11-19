import React, { useLayoutEffect, useMemo, useRef } from "react";
import { GraphNode, NodeOption, SubgraphNode } from "../../graph";
import type { GraphEditor } from "../../graph/editor";
import { useObservable, useObservableProp } from "../../reactive/hook";
import { GraphLayout } from "./rendering";
import { NodePropView } from "./node-prop-view";
import type { ProjectManager } from "../../editor/project-manager";

type GraphNodeViewProps = {
	node: GraphNode;
	editor: GraphEditor;
	layout: GraphLayout;
	selected: boolean;
	onNodePointerDown: (event: React.PointerEvent, node: GraphNode) => void;
	onLayoutChange: (node: GraphNode) => void;
	projectManager: ProjectManager;
	definitionVersion: number;
};

export const GraphNodeView = React.memo(({ projectManager, node, editor, layout, selected, onNodePointerDown, onLayoutChange, definitionVersion }: GraphNodeViewProps) => {
	node = useObservable(node);
	const position = useObservableProp(node, "position");

	const root = useRef<HTMLDivElement>(null);
	const { inputs, options, outputs } = GraphNode.getInterface(node);
	const outputTypes = new Map(outputs.map(port => [port.key, port.value]));
	const optionOutputNames = new Map<string, readonly string[]>();
	const attachedOutputs = new Set<string>();

	for (const option of options) {
		const value = node[option.name as keyof typeof node] as unknown as NodeOption<string>;
		const names = option.variants[value.value]?.outputs ?? [];

		optionOutputNames.set(option.name, names);
		names.forEach(name => attachedOutputs.add(name));
	}

	const style = useMemo<React.CSSProperties>(() => ({
		left: `calc(50% + ${position.x}px)`,
		top: `calc(50% + ${-position.y}px)`,
		transform: "translate(calc(-50% + var(--drag-x, 0px)), calc(-50% + var(--drag-y, 0px)))"
	}), [position.x, position.y]);

	useLayoutEffect(() => {
		const element = root.current;

		if (!element)
			return;

		layout.setNodeElement(node, element);
		onLayoutChange(node);

		const observer = new ResizeObserver(() => onLayoutChange(node));
		observer.observe(element);

		return () => {
			observer.disconnect();
			layout.setNodeElement(node, null);
		};
	}, [node, layout, onLayoutChange]);

	useLayoutEffect(() => {
		onLayoutChange(node);
	}, [node.position.x, node.position.y, node, onLayoutChange]);

	const onPointerDown = (e: React.PointerEvent) => {
		const target = e.target as HTMLElement;

		if (target.closest("input, select, textarea, button, .input-point, .output-point"))
			return;

		onNodePointerDown(e, node);
	};

	const name = node instanceof SubgraphNode ? node.definition?.name ?? "Subgraph (unnamed)" : node.name;

	const onDoubleClick = () => {
		if (!node.graph.manager)
			return;
		if ((node instanceof SubgraphNode) && node.definition) {
			const graph = node.graph.manager.get(node.definition.id);
			if (!graph)
				return;
			const editor = node.graph.manager.openEditor(graph);
			projectManager.openGraph(editor);
		}
	};

	return (
		<div ref={root} className={`graph-node ${selected ? "selected" : ""}`} style={style}>
			<div className="name" onPointerDown={onPointerDown} onDoubleClick={onDoubleClick}>{name}</div>
			<div className="body">
				{outputs.filter(port => !attachedOutputs.has(port.key)).map(port => (
					<NodePropView key={port.key} node={node} editor={editor} layout={layout} name={port.name} portKey={port.key} value={port.value} withOutput outputTypes={outputTypes} />
				))}
				{options.map(option => (
					<NodePropView key={option.name} node={node} editor={editor} layout={layout} name={option.name} outputNames={optionOutputNames.get(option.name) ?? []} outputTypes={outputTypes} />
				))}
				{inputs.map(port => (
					<NodePropView key={port.key} node={node} editor={editor} layout={layout} name={port.name} portKey={port.key} value={port.value} withInput outputTypes={outputTypes} />
				))}
			</div>
		</div>
	);
});
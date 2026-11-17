import React, { useEffect, useMemo, useRef } from "react";
import { GraphNode, NodeOption } from "../../graph";
import type { GraphEditor } from "../../graph/editor";
import { useObservable } from "../../reactive/hook";
import { GraphLayout } from "./rendering";
import { NodePropView } from "./node-prop-view";

type GraphNodeViewProps = {
	node: GraphNode;
	editor: GraphEditor;
	layout: GraphLayout;
	selected: boolean;
	onNodePointerDown: (event: React.PointerEvent, node: GraphNode) => void;
	onLayoutChange: (node: GraphNode) => void;
};

export const GraphNodeView = ({ node, editor, layout, selected, onNodePointerDown, onLayoutChange }: GraphNodeViewProps) => {
	node = useObservable(node);

	const root = useRef<HTMLDivElement>(null);
	const { inputs, options, outputs } = GraphNode.getInterface(node);
	const optionOutputNames = new Map<string, readonly string[]>();
	const attachedOutputs = new Set<string>();

	for (const option of options) {
		const value = node[option.name as keyof typeof node] as unknown as NodeOption<string>;
		const names = option.variants[value.value]?.outputs ?? [];

		optionOutputNames.set(option.name, names);
		names.forEach(name => attachedOutputs.add(name));
	}

	const style = useMemo<React.CSSProperties>(() => ({
		left: `calc(50% + ${node.position.x}px)`,
		top: `calc(50% + ${-node.position.y}px)`,
		transform: "translate(-50%, -50%)"
	}), [node.position.x, node.position.y]);

	useEffect(() => {
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

	return (
		<div ref={root} className={`graph-node ${selected ? "selected" : ""}`} style={style}>
			<div className="name" onPointerDown={event => onNodePointerDown(event, node)}>{node.name}</div>
			<div className="body">
				{options.map(option => (
					<NodePropView key={option.name} node={node} editor={editor} layout={layout} name={option.name} outputNames={optionOutputNames.get(option.name) ?? []} />
				))}
				{outputs.filter(port => !attachedOutputs.has(port.name)).map(port => (
					<NodePropView key={port.name} node={node} editor={editor} layout={layout} name={port.name} withOutput />
				))}
				{inputs.map(port => (
					<NodePropView key={port.name} node={node} editor={editor} layout={layout} name={port.name} withInput />
				))}
			</div>
		</div>
	);
};

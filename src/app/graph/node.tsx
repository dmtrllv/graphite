
import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { GraphNode, NodeOption, Vec2 } from "../../graph";
import { useObservable } from "../../reactive/hook";
import { stopPropagation } from "../../utils";
import { useMouseMove } from "../../hooks";
import { NodePropView } from "./node-prop-view";

type GraphNodeViewProps = {
	node: GraphNode;
	onLayoutChange: (node: GraphNode) => void;
	onLayoutRemove: (node: GraphNode) => void;
};

export const GraphNodeView = ({ node, onLayoutChange, onLayoutRemove }: GraphNodeViewProps) => {
	node = useObservable(node);

	const graph = useObservable(node.graph);
	const root = useRef<HTMLDivElement>(null);
	const selectedNodePositions = useRef<Vec2[]>([]);

	const { onMouseDown } = useMouseMove(node.position, (pos, offset) => {
		if (node.graph.isSelected(node) && node.graph.selectedNodes.length > 0) {
			node.graph.selectedNodes.forEach((n, i) => {
				n.position = selectedNodePositions.current[i]!.clone().add(offset);
			});
		} else {
			node.position = pos;
		}
	}, 1 / graph.scale, true);

	const { inputs, options, outputs } = GraphNode.getInterface(node);

	const optionOutputNames = new Map<string, readonly string[]>();
	const attachedOutputs = new Set<string>();

	for (const option of options) {
		const value = node[option.name as keyof typeof node] as unknown as NodeOption<string>;
		const names = option.variants[value.value]?.outputs ?? [];

		optionOutputNames.set(option.name, names);
		names.forEach(name => attachedOutputs.add(name));
	}

	const style = useMemo<React.CSSProperties>(() => {
		return {
			left: `calc(50% + ${node.position.x}px)`,
			top: `calc(50% + ${-node.position.y}px)`,
			transform: "translate(-50%, -50%)"
		};
	}, [node.position.x, node.position.y]);

	useLayoutEffect(() => {
		onLayoutChange(node);
	}, [node, node.position.x, node.position.y, onLayoutChange]);

	useLayoutEffect(() => () => onLayoutRemove(node), [node, onLayoutRemove]);

	useEffect(() => {
		if (!root.current)
			return;

		const observer = new ResizeObserver(() => onLayoutChange(node));
		observer.observe(root.current);

		return () => observer.disconnect();
	}, [node, onLayoutChange]);

	const mouseDown = (e: React.MouseEvent) => {
		if (node.graph.isSelected(node) && node.graph.selectedNodes.length > 0) {
			e.stopPropagation();
			selectedNodePositions.current = node.graph.selectedNodes.map(n => n.position.clone());
		}

		onMouseDown(e);
	};

	return (
		<div ref={root} className={`graph-node ${node.graph.isSelected(node) ? "selected" : ""}`} style={style} onMouseDown={stopPropagation}>
			<div className="name" onMouseDown={mouseDown}>{node.name}</div>
			<div className="body">
				{options.map(option => (
					<NodePropView key={option.name} node={node} name={option.name} outputNames={optionOutputNames.get(option.name) ?? []} />
				))}
				{outputs.filter(port => !attachedOutputs.has(port.name)).map(port => (
					<NodePropView key={port.name} node={node} name={port.name} withOutput />
				))}
				{inputs.map(port => (
					<NodePropView key={port.name} node={node} name={port.name} withInput />
				))}
			</div>
		</div>
	);
};

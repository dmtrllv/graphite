import type { Node, NodeType } from "@graphite/node";
import { getNodeView } from "./nodes";
import { useSyncExternalStore, type CSSProperties } from "react";
import { useMouseMove } from "@hooks";

const useNodePositionStore = (node: Node): CSSProperties => {
	useSyncExternalStore((onChange) => node.on("position-changed", onChange), node.getRevision);
	return {
		left: `${node.position[0]}px`,
		top: `${node.position[1]}px`,
	};
};

export const NodeView = ({ node }: NodeViewProps) => {
	const Component = getNodeView(node.constructor as NodeType<any, any>);
	const style = useNodePositionStore(node);

	const onMouseDown = useMouseMove({ x: node.position[0], y: node.position[1] }, ({ x, y }) => node.position = [x, y]);

	return (
		<div className="node" style={style}>
			<div className="header" onMouseDown={onMouseDown}>
				{node.name}
			</div>
			<div className="body">
				<Component node={node} />
			</div>
		</div>
	);
};

type NodeViewProps = {
	node: Node;
};
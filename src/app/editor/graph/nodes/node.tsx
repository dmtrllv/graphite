import type { Node, NodeInputKeys, NodeInputTypes, NodeOutputKeys, NodeOutputTypes, NodeType } from "@graphite/node";
import { getNodeView } from "./registry";
import { useMemo, useSyncExternalStore, type CSSProperties, type PropsWithChildren } from "react";
import { useMouseMove } from "../../../ui/hooks";
import type { InputPort, OutputPort } from "@graphite/port";
import { cn } from "@utils";

export const useNodeState = <T extends {}>(node: Node<T>): NodeState<T> => {
	useSyncExternalStore((onChange) => node.on("state-changed", onChange), node.getRevision);
	const dispatcher: NodeStateDispatcher<T> = (key, val) => node.update({ [key]: val } as any);
	const keyedDispatcher: KeyedNodeStateDispatcher<T> = (key) => (val) => node.update({ [key]: val } as any);
	return [node.state, dispatcher, keyedDispatcher];
};

export type NodeStateDispatcher<T extends {}> = <K extends keyof T>(key: K, value: T[K]) => void;
export type KeyedNodeStateDispatcher<T extends {}> = <K extends keyof T>(key: K) => (value: T[K]) => void;

export type NodeState<T extends {}> = readonly [Readonly<T>, NodeStateDispatcher<T>, KeyedNodeStateDispatcher<T>];

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

	const { startMouseMove } = useMouseMove(node.position, pos => node.position = pos);

	const category = useMemo(() => node.category.replace(" ", "-").toLowerCase(), [node.category]);

	return (
		<div className={cn("node", {}, category)} style={style}>
			<div className="header" onMouseDown={startMouseMove}>
				{node.name}
			</div>
			<div className="body">
				<Component node={node} />
			</div>
		</div>
	);
};

export type NodeViewProps = {
	node: Node;
};

export const NodeOutput = <T extends Node, K extends NodeOutputKeys<T>, U extends NodeOutputTypes<T>[K]>({ children, port, hidePortName = false }: NodeOutputProps<T, K, U>) => {
	return (
		<div className="node-output">
			{port && (
				<>
					{!hidePortName && <div className="port-name">{port.type.name}</div>}
					<div className={cn("port", {}, port.type.name)} />
				</>
			)}
			{children}
		</div>
	);
};

export type NodeOutputProps<T extends Node, K extends NodeOutputKeys<T>, U extends NodeOutputTypes<T>[K]> = PropsWithChildren<{
	port?: OutputPort<T, K, U>;
	hidePortName?: boolean;
}>;

export const NodeInput = <T extends Node, K extends NodeInputKeys<T>, U extends NodeInputTypes<T>[K]>({ children, port }: NodeInputProps<T, K, U>) => {
	return (
		<div className="node-input">
			{children}
			{port && <div className={cn("port", {}, port.type.name)} />}
		</div>
	);
};

export type NodeInputProps<T extends Node, K extends NodeOutputKeys<T>, U extends NodeOutputTypes<T>[K]> = PropsWithChildren<{
	port?: InputPort<T, K, U>;
}>;

import type { Node, NodeType } from "@graphite/node";
import { assert } from "@utils";

const registry = new Map<NodeType<any, any>, NodeComponentView<any>>();

export const registerNodeView = <T extends Node>(type: NodeType<T, any>, component: NodeComponentView<T>) => {
	assert(!registry.has(type));
	registry.set(type, component);
};

export const getNodeView = <T extends Node>(type: NodeType<T, any>) => assert.notNull(registry.get(type), `Could not get node view for ${type}`) as NodeComponentView<T>;

export type NodeComponentView<T extends Node> = React.FC<{ node: T }>;
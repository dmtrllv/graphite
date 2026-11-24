import { assert } from "../../../utils";
import { GraphInputNode, GraphOutputNode } from "./graph";
import { MathNodes } from "./math";
import { SubGraphNode } from "./subgraph";
import { ValueNode } from "./value";

export const DEFAULT_NODES = [
	...MathNodes,
	ValueNode,
	SubGraphNode,
	GraphInputNode,
];

export const ALL_NODES = [
	...DEFAULT_NODES,
	GraphOutputNode,
	GraphInputNode,
];

export const getNodeType = (type: string): (typeof ALL_NODES)[number] => {
	return assert.notNull(ALL_NODES.find(n => n.name === type));
};
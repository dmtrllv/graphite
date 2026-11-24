import { MathNodes } from "./math";
import { SubGraphNode } from "./subgraph";
import { ValueNode } from "./value";

export const DEFAULT_NODES = [
	...MathNodes,
	ValueNode,
	SubGraphNode,
];
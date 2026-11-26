import { BinOpNode } from "./math";
import { SubGraphNode } from "./subgraph";
import { ValueNode } from "./value";

export const DEFAULT_NODE_TYPES = [
	ValueNode,
	BinOpNode,
	SubGraphNode,
] as const;
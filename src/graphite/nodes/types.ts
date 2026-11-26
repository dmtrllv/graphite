import { ValueNode } from "./value";
import { BinOpNode } from "./math";

export const DEFAULT_NODE_TYPES = [
	ValueNode,
	BinOpNode,
] as const;
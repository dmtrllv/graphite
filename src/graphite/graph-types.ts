import { assert } from "@utils";
import { Pass } from "./pass";
import { SubGraph } from "./subgraph";
import type { GraphType } from "./graph";

export const GRAPH_TYPES = [
	Pass,
	SubGraph
] as const;

export const parseGraphType = (name: string): GraphType<any, any, any> => assert.notNull(GRAPH_TYPES.find(t => t.name === name));
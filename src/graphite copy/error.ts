import { createTaggedEnum, type TaggedEnumType } from "@utils";
import type { Graph } from "./graph";
import type { Node, NodeType } from "./nodes";

export const GraphError = createTaggedEnum({
	InvalidGraph: (graph: Graph<any>) => `Invalid graph ${graph.name}`,
	InvalidNode: (graph: Graph<any>, node: Node) => `Invalid node ${node.id} at graph ${graph.name}`,
	InvalidNodeType: (graph: Graph<any>, node: NodeType<any>) => `Invalid node type ${node.name} at graph ${graph.name}`,
	EdgeCycle: () => `Edge creates a cycle`,
	DuplicateGraphName: (name: string) => `Duplicate graph name ${name}`,
	MissingPort: (node: Node, type: "input" | "output", port: string) => `Missing ${type} port ${port} on ${node.type}`,
	InvalidGroupBoundary: () => `Edge crosses a group boundary without using its boundary nodes`,
	Error: (err: Error) => err.name,
});

export type GraphError = TaggedEnumType<typeof GraphError>;

export const graphErrorToString = (error: GraphError) => error.toString();
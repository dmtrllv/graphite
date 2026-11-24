import { createTaggedEnum, type TaggedEnumType } from "@utils";
import type { Graph } from "./graph";
import type { Node, NodeType } from "./nodes";

export const GraphError = createTaggedEnum({
	InvalidGraph: (graph: Graph) => `Invalid graph ${graph.name}`,
	InvalidNode: (graph: Graph, node: Node) => `Invalid node ${node.id} at graph ${graph.name}`,
	InvalidNodeType: (graph: Graph, node: NodeType<any, any>) => `Invalid node type ${node.name} at graph ${graph.name}`,
	EdgeCycle: () => `Edge creates a cycle`,
	DuplicateGraphName: (name: string) => `Duplicate graph name ${name}`,
	Error: (err: Error) => err.name,
});

export type GraphError = TaggedEnumType<typeof GraphError>;

export const graphErrorToString = (error: GraphError) => error.toString();
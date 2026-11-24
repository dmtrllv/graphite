import { createEnum, type EnumType } from "@utils";
import type { Graph, Edge } from "./graph";

export const GraphErrorType = createEnum(
	"InvalidGraph",
	"InvalidNode",
	"InvalidEdge",
	"NotInitialized"
);

export type GraphErrorType = EnumType<typeof GraphErrorType>;

export class GraphError extends Error {
	public readonly type: GraphErrorType;
	public readonly node: Node | undefined;
	public readonly graph: Graph;
	public readonly edge: Edge | undefined;

	public constructor(graph: Graph, error: GraphErrorType, node?: Node, edge?: Edge) {
		super(error);
		this.type = error;
		this.graph = graph;
		this.node = node;
		this.edge = edge;
	}
}
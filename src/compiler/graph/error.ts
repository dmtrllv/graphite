import { createEnum, type EnumType } from "@utils";

export const GraphError = createEnum(
	"InvalidGraph",
	"InvalidNode",
	"InvalidNodeType",
	"InvalidEdge",
	"NotInitialized"
);

export type GraphError = EnumType<typeof GraphError>;
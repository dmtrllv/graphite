import { PassGraph } from "./pass";
import { SubGraph } from "./subgraph";
import { WorldGraph } from "./world";

export const Graphs = {
	WorldGraph,
	SubGraph,
	PassGraph,
} as const;

export const getGraphType = (name: string) => {
	if(!(name in Graphs))
		throw new Error(`Invalid graph type name "${name}"!`);
	return Graphs[name as keyof typeof Graphs];
}
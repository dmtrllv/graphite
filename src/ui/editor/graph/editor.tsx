import type { Graph } from "@graphite/graph";
import { mapChildren } from "../../../utils";

export const GraphEditor = ({ graph }: GraphEditorProps) => {
	return (
		<div>
			<canvas />
			{mapChildren(graph.nodes, (node) => (
				<div>
					{node.type}
				</div>
			))}
		</div>
	);
};

export type GraphEditorProps = {
	graph: Graph;
};
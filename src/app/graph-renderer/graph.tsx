import type { Graph } from "../../graph";
import { mapChildren } from "../../utils";
import { GraphNodeView } from "./node";

import "./graph.scss";

export const GraphRenderer = ({ graph }: { graph: Graph }) => {
	
	return (
		<div className="graph-renderer">
			<canvas />
			{mapChildren(graph.nodes, (k, v) => <GraphNodeView key={k} node={v} />)}
		</div>
	);
};
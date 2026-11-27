import type { Graph } from "@graphite/graph";
import { mapChildren } from "@utils";
import { NodeView } from "./node";
import { useSyncExternalStore } from "react";

import "./styles/editor.scss";

const useGraphStore = (graph: Graph) => useSyncExternalStore(graph.subscribe, graph.getRevision);

export const GraphEditor = ({ graph }: GraphEditorProps) => {
	useGraphStore(graph);

	return (
		<div className="graph-editor">
			<div className="renderer">
				<canvas />
				{mapChildren(graph.nodes, (node) => <NodeView node={node} />)}
			</div>
		</div>
	);
};

export type GraphEditorProps = {
	graph: Graph;
};
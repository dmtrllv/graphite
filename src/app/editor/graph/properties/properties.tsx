import { subscribe } from "@reactive";
import { WorldGraph, Subgraph, PassGraph, SimulationGraph, type Graph } from "@editor";
import { useEffect, useState } from "react";
import { GraphPropertiesHeader } from "./header";
import { GraphIdentity } from "./identity";
import { GraphSubgraphs } from "./subgraphs";
import { GraphInterface } from "./interface";
import { GraphDefinitions } from "./definitions";

import "./styles/properties.scss";

type GraphPropertiesProps = {
	graph: Graph;
	onOpenGraph: (graph: Graph) => void;
};

export const GraphProperties = ({ graph, onOpenGraph }: GraphPropertiesProps) => {
	const manager = graph.manager!;
	const [collapsed, setCollapsed] = useState(false);
	const [catalogVersion, setCatalogVersion] = useState(manager.catalogVersion);
	const isWorldGraph = graph instanceof WorldGraph;
	const isSubgraph = graph instanceof Subgraph;

	useEffect(() => subscribe(graph, () => setCatalogVersion(version => version + 1)), [graph]);

	useEffect(() => {
		if (isWorldGraph)
			return;

		return subscribe(manager, event => {
			if (event.key === "catalogVersion")
				setCatalogVersion(manager.catalogVersion);
		});
	}, [manager, isWorldGraph]);

	return (
		<div className={`graph-properties ${collapsed ? "collapsed" : ""}`} data-catalog-version={catalogVersion}>
			<GraphPropertiesHeader isWorldGraph={isWorldGraph} collapsed={collapsed} onToggle={() => setCollapsed(value => !value)} />
			<div className="content">
				{isWorldGraph && <GraphSubgraphs graph={graph as WorldGraph} onOpenGraph={onOpenGraph} />}
				{!isWorldGraph && <GraphIdentity graph={graph} />}
				{isSubgraph && <GraphInterface graph={graph} />}
				{graph instanceof PassGraph && <GraphDefinitions graph={graph} />}
				{graph instanceof SimulationGraph && <GraphDefinitions graph={graph} />}
			</div>
		</div>
	);
};
import type { WorldGraph, Graph } from "@editor";

type GraphSubgraphsProps = {
	graph: WorldGraph;
	onOpenGraph: (graph: Graph) => void;
};

export const GraphSubgraphs = ({ graph, onOpenGraph }: GraphSubgraphsProps) => {
	const availableSubgraphs = graph.manager!.getAvailableSubgraphs(graph);

	return (
		<div className="subgraphs">
			<div className="title">
				<span>Subgraphs</span>
			</div>
			<div className="group">
				{availableSubgraphs.map(definition => (
					<div key={definition.id} className="subgraph" onClick={() => onOpenGraph(definition)}>
						{definition.name}
					</div>
				))}
			</div>
		</div>
	);
};
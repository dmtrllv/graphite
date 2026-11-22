import type { Graph } from "@editor";

type GraphSubgraphsProps = {
	graph: Graph;
	onOpenGraph: (graph: Graph) => void;
};

export const GraphSubgraphs = ({ graph, onOpenGraph }: GraphSubgraphsProps) => {
	const availableSubgraphs = graph.manager!.getAvailableSubgraphs(graph).filter(g => g !== graph);
	
	if(availableSubgraphs.length === 0)
		return null;

	return (
		<div className="group">
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
import { observable } from "../../reactive";
import { GraphInputNode, GraphOutputNode } from "./graph-io";
import { GraphNode } from "./node";

@GraphNode.register("Subgraph")
export class SubgraphNode extends GraphNode {
	@observable
	public accessor graphId: number | null = this.getDefaultGraphId();

	private getDefaultGraphId(): number | null {
		return [...(this.graph.manager?.graphs.values() ?? [])].find(graph => !graph.isWorldGraph)?.id ?? null;
	}

	public get definition() {
		if (this.graphId === null)
			return undefined;

		const graph = this.graph.manager?.get(this.graphId);

		if (!graph || graph.isWorldGraph)
			return undefined;

		return graph;
	}

	public override getInterface() {
		const definition = this.definition;
		const inputs: any[] = [];
		const outputs: any[] = [];

		if (!definition)
			return { inputs, outputs, options: [] };

		for (const node of definition.nodes.values()) {
			if (node instanceof GraphInputNode) {
				inputs.push({
					key: node.interfaceId,
					name: node.interfaceName,
					direction: "input" as const,
					value: node.value
				});
			} else if (node instanceof GraphOutputNode) {
				outputs.push({
					key: node.interfaceId,
					name: node.interfaceName,
					direction: "output" as const,
					value: node.value
				});
			}
		}

		return { inputs, outputs, options: [] };
	}

	public override serializeData(): Record<string, unknown> {
		return { graphId: this.graphId };
	}

	public override restoreData(data: Record<string, unknown>): void {
		if (typeof data["graphId"] === "number" || data["graphId"] === null)
			this.graphId = data["graphId"];
	}
}

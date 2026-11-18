import { observable } from "../../reactive";
import { GraphNode } from "./node";

@GraphNode.register("Subgraph")
export class SubgraphNode extends GraphNode {
	@observable
	public accessor graphId: number | null = null;

	public get definition() {
		if (this.graphId === null)
			return undefined;

		const graph = this.graph.manager?.get(this.graphId);

		if (!graph || graph.isWorldGraph || this.graph.manager?.hasRecursiveReference(this.graph, graph))
			return undefined;

		return graph;
	}

	public override getInterface() {
		const definition = this.definition;

		return {
			inputs: definition?.inputs.map(port => ({
				key: port.id,
				name: port.name,
				direction: "input" as const,
				value: port.type
			})) ?? [],
			outputs: definition?.outputs.map(port => ({
				key: port.id,
				name: port.name,
				direction: "output" as const,
				value: port.type
			})) ?? [],
			options: []
		};
	}

	public override serializeData(): Record<string, unknown> {
		return { graphId: this.graphId };
	}

	public override restoreData(data: Record<string, unknown>): void {
		if (typeof data["graphId"] === "number" || data["graphId"] === null)
			this.graphId = data["graphId"];
	}
}
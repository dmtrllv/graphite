import { observable } from "../../reactive";
import { Subgraph } from "../graph";
import { GraphNode, GraphNodeCategory } from "./node";

@GraphNode.register(GraphNodeCategory.SubGraph, "Subgraph")
export class SubgraphNode extends GraphNode {
	@observable
	private accessor _graphId: number | null = null;

	public get graphId(): number | null {
		return this._graphId;
	}

	public set graphId(value: number | null) {
		const manager = this.graph.manager;
		const definition = value === null ? undefined : manager?.get(value);

		if (definition && !(definition instanceof Subgraph))
			throw new Error("Only Subgraphs can be used as SubgraphNodes!");

		if (definition && manager?.hasRecursiveReference(this.graph, definition))
			throw new Error("A graph cannot reference itself or one of its parent graphs!");

		if (this._graphId === value)
			return;

		this._graphId = value;
		manager?.notifySubgraphTopologyChanged();
	}

	public get definition(): Subgraph | undefined {
		if (this.graphId === null)
			return undefined;

		const graph = this.graph.manager?.get(this.graphId);
		return graph instanceof Subgraph ? graph : undefined;
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

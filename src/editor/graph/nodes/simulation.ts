
import { observable } from "@reactive";
import { F32, Type, Vec2 } from "../types";
import { SimulationGraph } from "../graph";
import { GraphNode, GraphNodeCategory } from "./node";

export type SimulationInputKind = "parameter" | "state";

abstract class SimulationNode extends GraphNode {
	public constructor(id: number, graph: SimulationGraph, position?: Vec2) {
		super(id, graph, position);

		if (!(graph instanceof SimulationGraph))
			throw new Error("Simulation nodes can only be used in SimulationGraphs!");
	}
}

@GraphNode.register(GraphNodeCategory.Simulation, "Simulation Input")
export class SimulationInputNode extends SimulationNode {
	@observable
	public accessor inputId = crypto.randomUUID() as string;

	@observable
	public override accessor name = "Input";

	@observable
	public accessor inputKind: SimulationInputKind = "parameter";

	@observable
	public accessor stateId: string | null = null;

	@observable
	public accessor value: Type = new F32(0);

	public override getInterface() {
		return {
			inputs: [],
			outputs: [{
				key: "value",
				name: this.name,
				direction: "output" as const,
				value: this.value
			}],
			options: []
		};
	}

	public override serializeData(): Record<string, unknown> {
		return {
			inputId: this.inputId,
			name: this.name,
			inputKind: this.inputKind,
			stateId: this.stateId,
			value: this.value
		};
	}

	public override restoreData(data: Record<string, unknown>): void {
		if (typeof data["inputId"] === "string")
			this.inputId = data["inputId"];

		if (typeof data["name"] === "string")
			this.name = data["name"];

		if (data["inputKind"] === "parameter" || data["inputKind"] === "state")
			this.inputKind = data["inputKind"];

		if (typeof data["stateId"] === "string" || data["stateId"] === null)
			this.stateId = data["stateId"];

		if (data["value"] instanceof Type)
			this.value = data["value"];
	}
}

@GraphNode.register(GraphNodeCategory.Simulation, "Simulation Output")
export class SimulationOutputNode extends SimulationNode {
	@observable
	public accessor stateId = crypto.randomUUID() as any;

	@observable
	public override accessor name = "State";

	@observable
	public accessor value: Type = new F32(0);

	public override getInterface() {
		return {
			inputs: [{
				key: "value",
				name: this.name,
				direction: "input" as const,
				value: this.value
			}],
			outputs: [],
			options: []
		};
	}

	public override serializeData(): Record<string, unknown> {
		return {
			stateId: this.stateId,
			name: this.name,
			value: this.value
		};
	}

	public override restoreData(data: Record<string, unknown>): void {
		if (typeof data["stateId"] === "string")
			this.stateId = data["stateId"];

		if (typeof data["name"] === "string")
			this.name = data["name"];

		if (data["value"] instanceof Type)
			this.value = data["value"];
	}
}

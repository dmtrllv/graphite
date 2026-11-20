
import { observable } from "@reactive";
import { F32, Type, Vec2 } from "../types";
import { SimulationGraph } from "../graph";
import { GraphNode, GraphNodeCategory } from "./node";
import { serializable } from "../../serializable";

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
	@serializable(String)
	public accessor inputId = crypto.randomUUID() as string;

	@observable
	@serializable(String)
	public override accessor name = "Input";

	@observable
	@serializable(String)
	public accessor inputKind: SimulationInputKind = "parameter";

	@observable
	@serializable(String)
	public accessor stateId: string | null = null;

	@observable
	@serializable(Type)
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
}

@GraphNode.register(GraphNodeCategory.Simulation, "Simulation Output")
export class SimulationOutputNode extends SimulationNode {
	@observable
	@serializable(String)
	public accessor stateId = crypto.randomUUID();

	@observable
	@serializable(String)
	public override accessor name = "State";

	@observable
	@serializable(Type)
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
}

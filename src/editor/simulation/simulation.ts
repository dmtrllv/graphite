import { observable } from "@reactive";
import { Serializable, serializable, recordOf } from "../serializable";
import { SimulationGraph } from "../graph";

export type SimulationInputBindings = Record<string, string>;

@serializable({ type: "simulation", create: data => new Simulation(data.id, data.name, data.graphId) })
export class Simulation extends Serializable {
	@serializable(Number)
	public readonly id: number;

	@observable
	@serializable(String)
	public accessor name: string;

	@observable
	@serializable(Number)
	public accessor graphId: number;

	@observable
	@serializable(Number)
	public accessor iterations = 1;

	@observable({ recursive: true })
	@serializable(recordOf(String))
	public accessor inputBindings: SimulationInputBindings = {};

	public constructor(id: number, name: string, graphId: number) {
		super();
		this.id = id;
		this.name = name;
		this.graphId = graphId;
	}

	public setGraph(graph: SimulationGraph): void {
		this.graphId = graph.id;
	}

	public validate(): void {
		if (!Number.isInteger(this.iterations) || this.iterations < 1)
			throw new Error("Simulation iteration count must be a positive integer!");
	}
}
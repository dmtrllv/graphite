import { observable } from "@reactive";
import { SimulationGraph } from "../graph";

export type SimulationInputBindings = Record<string, string>;

export class Simulation {
	public readonly id: number;

	@observable
	public accessor name: string;

	@observable
	public accessor graphId: number;

	@observable
	public accessor iterations = 1;

	@observable({ recursive: true })
	public accessor inputBindings: SimulationInputBindings = {};

	public constructor(id: number, name: string, graph: SimulationGraph) {
		this.id = id;
		this.name = name;
		this.graphId = graph.id;
	}

	public setGraph(graph: SimulationGraph): void {
		this.graphId = graph.id;
	}

	public validate(): void {
		if (!Number.isInteger(this.iterations) || this.iterations < 1)
			throw new Error("Simulation iteration count must be a positive integer!");
	}
}

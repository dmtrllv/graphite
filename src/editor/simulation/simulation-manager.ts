import { observable } from "@reactive";
import { SimulationGraph, type GraphManager } from "../graph";
import { Simulation } from "./simulation";
import { Serializable, serializable, mapOf } from "../serializable";

@observable
@serializable({ type: "simulation-manager", create: () => new SimulationManager() })
export class SimulationManager extends Serializable {
	private _idCounter = 0;

	public graphManager!: GraphManager;

	@observable
	@serializable(mapOf(Number, Simulation))
	public accessor simulations = new Map<number, Simulation>();

	public constructor(graphManager?: GraphManager) {
		super();
		this.graphManager = graphManager!;
	}

	protected override initialize(): void {
		this._idCounter = 0;

		for (const simulation of this.simulations.values()) {
			simulation.validate();
			this._idCounter = Math.max(this._idCounter, simulation.id + 1);
		}
	}

	public get(id: number): Simulation | undefined {
		return this.simulations.get(id);
	}

	public create(graph: SimulationGraph, name?: string): Simulation {
		if (this.graphManager.get(graph.id) !== graph)
			throw new Error("SimulationGraph does not belong to this project!");

		const simulationName = name ?? this.getAvailableName();

		if ([...this.simulations.values()].some(simulation => simulation.name === simulationName))
			throw new Error(`Simulation with name "${simulationName}" already exists!`);

		const simulation = new Simulation(this._idCounter++, simulationName, graph.id);
		this.simulations.set(simulation.id, simulation);
		return simulation;
	}

	public restore(simulation: Simulation): void {
		if (this.simulations.has(simulation.id))
			throw new Error(`Simulation with ID ${simulation.id} already exists!`);

		if ([...this.simulations.values()].some(item => item.name === simulation.name))
			throw new Error(`Simulation with name "${simulation.name}" already exists!`);

		const graph = this.graphManager.get(simulation.graphId);

		if (!(graph instanceof SimulationGraph) || this.graphManager.get(graph.id) !== graph)
			throw new Error(`Simulation ${simulation.id} references an invalid SimulationGraph!`);

		simulation.validate();
		this.simulations.set(simulation.id, simulation);
		this._idCounter = Math.max(this._idCounter, simulation.id + 1);
	}

	public remove(simulation: Simulation): void {
		if (this.simulations.get(simulation.id) === simulation)
			this.simulations.delete(simulation.id);
	}

	private getAvailableName(): string {
		let index = 1;
		let name = `Simulation ${index}`;

		while ([...this.simulations.values()].some(simulation => simulation.name === name))
			name = `Simulation ${++index}`;

		return name;
	}

	public setGraphManager(graphManager: GraphManager): void {
		this.graphManager = graphManager;
		this._idCounter = 0;

		for (const simulation of this.simulations.values()) {
			simulation.validate();

			const graph = graphManager.get(simulation.graphId);

			if (!(graph instanceof SimulationGraph))
				throw new Error(`Simulation ${simulation.id} references an invalid SimulationGraph!`);

			this._idCounter = Math.max(this._idCounter, simulation.id + 1);
		}
	}
}
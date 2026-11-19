import { observable } from "@reactive";
import { SimulationGraph, type GraphManager } from "../graph";
import { Simulation } from "./simulation";

export class SimulationManager {
	private _idCounter = 0;

	private readonly graphManager: GraphManager;

	@observable
	public accessor simulations = new Map<number, Simulation>();

	public constructor(graphManager: GraphManager) {
		this.graphManager = graphManager;
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

		const simulation = new Simulation(this._idCounter++, simulationName, graph);
		this.simulations.set(simulation.id, simulation);
		return simulation;
	}

	public restore(simulation: Simulation): void {
		if (this.simulations.has(simulation.id))
			throw new Error(`Simulation with ID ${simulation.id} already exists!`);

		if ([...this.simulations.values()].some(item => item.name === simulation.name))
			throw new Error(`Simulation with name "${simulation.name}" already exists!`);

		const graph = this.graphManager.get(simulation.graphId);

		if (!(graph instanceof SimulationGraph))
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
}

export interface SerializedSimulation {
	id: number;
	name: string;
	graphId: number;
	iterations: number;
	inputBindings: Record<string, string>;
}

export interface SerializedSimulationManager {
	simulations: SerializedSimulation[];
}

export const serializeSimulationManager = (manager: SimulationManager): SerializedSimulationManager => ({
	simulations: [...manager.simulations.values()].map(simulation => ({
		id: simulation.id,
		name: simulation.name,
		graphId: simulation.graphId,
		iterations: simulation.iterations,
		inputBindings: { ...simulation.inputBindings }
	}))
});

export const deserializeSimulationManager = (json: SerializedSimulationManager, graphManager: GraphManager): SimulationManager => {
	const manager = new SimulationManager(graphManager);

	for (const item of json.simulations) {
		const graph = graphManager.get(item.graphId);

		if (!(graph instanceof SimulationGraph))
			throw new Error(`Simulation ${item.id} references an invalid SimulationGraph!`);

		const simulation = new Simulation(item.id, item.name, graph);
		simulation.iterations = item.iterations;
		simulation.inputBindings = { ...item.inputBindings };
		manager.restore(simulation);
	}

	return manager;
};

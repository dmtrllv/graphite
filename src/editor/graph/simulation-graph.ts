import { SimulationGraph } from "./graph";
import { SimulationInputNode } from "./nodes/simulation";

export type SimulationStatePair = {
	id: string;
	input: SimulationInputNode;
};

export const getSimulationStatePairs = (graph: SimulationGraph): SimulationStatePair[] => {
	const inputs = [...graph.nodes.values()].filter((node): node is SimulationInputNode =>
		node instanceof SimulationInputNode && node.inputKind === "state"
	);

	const inputIds = new Set<string>();

	for (const input of inputs) {
		if (!input.stateId)
			throw new Error(`Simulation state input "${input.name}" has no state ID!`);

		if (inputIds.has(input.stateId))
			throw new Error(`Duplicate simulation state input ID "${input.stateId}"!`);

		inputIds.add(input.stateId);

		if (!graph.states.has(input.stateId))
			throw new Error(`Simulation state input "${input.name}" references an unknown state!`);
	}

	return inputs.map(input => ({
		id: input.stateId!,
		input
	}));
};

export const validateSimulationGraph = (graph: SimulationGraph): void => {
	const inputIds = new Set<string>();

	for (const node of graph.nodes.values()) {
		if (!(node instanceof SimulationInputNode))
			continue;

		if (!node.inputId || inputIds.has(node.inputId))
			throw new Error(`Duplicate or invalid simulation input ID "${node.inputId}"!`);

		inputIds.add(node.inputId);

		if (node.inputKind === "state" && (!node.stateId || !graph.states.has(node.stateId)))
			throw new Error(`Simulation state input "${node.name}" references an invalid state!`);

		if (node.inputKind === "parameter" && node.stateId !== null)
			throw new Error(`Simulation parameter "${node.name}" cannot have a state ID!`);
	}

	for (const [id, state] of graph.states) {
		if (!id || id !== state.id)
			throw new Error(`Simulation state Map key does not match its definition ID "${state.id}"!`);
	}

	getSimulationStatePairs(graph);
};

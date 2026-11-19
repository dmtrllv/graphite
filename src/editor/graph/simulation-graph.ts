import { SimulationGraph } from "./graph";
import { SimulationInputNode, SimulationOutputNode } from "./nodes/simulation";

export type SimulationStatePair = {
	id: string;
	input: SimulationInputNode;
	output: SimulationOutputNode;
};

export const getSimulationStatePairs = (graph: SimulationGraph): SimulationStatePair[] => {
	const inputs = [...graph.nodes.values()].filter((node): node is SimulationInputNode =>
		node instanceof SimulationInputNode && node.inputKind === "state"
	);
	const outputs = [...graph.nodes.values()].filter((node): node is SimulationOutputNode =>
		node instanceof SimulationOutputNode
	);

	const inputIds = new Set<string>();
	const outputIds = new Set<string>();

	for (const input of inputs) {
		if (!input.stateId)
			throw new Error(`Simulation state input "${input.name}" has no state ID!`);

		if (inputIds.has(input.stateId))
			throw new Error(`Duplicate simulation state input ID "${input.stateId}"!`);

		inputIds.add(input.stateId);
	}

	for (const output of outputs) {
		if (!output.stateId)
			throw new Error(`Simulation state output "${output.name}" has no state ID!`);

		if (outputIds.has(output.stateId))
			throw new Error(`Duplicate simulation state output ID "${output.stateId}"!`);

		outputIds.add(output.stateId);
	}

	if (inputIds.size !== outputIds.size || [...inputIds].some(id => !outputIds.has(id)))
		throw new Error("Simulation state inputs and outputs do not match!");

	return inputs.map(input => {
		const output = outputs.find(item => item.stateId === input.stateId)!;

		if (input.value.constructor !== output.value.constructor)
			throw new Error(`Simulation state "${input.name}" has mismatched input and output types!`);

		return {
			id: input.stateId!,
			input,
			output
		};
	});
};

export const validateSimulationGraph = (graph: SimulationGraph): void => {
	const inputIds = new Set<string>();

	for (const node of graph.nodes.values()) {
		if (!(node instanceof SimulationInputNode))
			continue;

		if (!node.inputId || inputIds.has(node.inputId))
			throw new Error(`Duplicate or invalid simulation input ID "${node.inputId}"!`);

		inputIds.add(node.inputId);

		if (node.inputKind === "state" && !node.stateId)
			throw new Error(`Simulation state input "${node.name}" has no state ID!`);

		if (node.inputKind === "parameter" && node.stateId !== null)
			throw new Error(`Simulation parameter "${node.name}" cannot have a state ID!`);
	}

	getSimulationStatePairs(graph);
};

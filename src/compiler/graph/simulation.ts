
import { getWGSLType } from "../types";
import { Group, compileGroupBody, type GroupCompileContext } from "./group";
import { SimulationInputNode, SimulationOutputNode } from "./nodes";

export class SimulationGroup extends Group {
	public override get inputNodeType() {
		return SimulationInputNode;
	}

	public override get outputNodeType() {
		return SimulationOutputNode;
	}

	public override async compile(context: GroupCompileContext) {
		const iterationCount = context.input.outputs["iterationCount"];
		const feedbackEdges = context.graph.edges.filter(edge => edge.target === context.outputNode.id && edge.inputPort !== "iterationCount");

		if (!feedbackEdges.length)
			return { outputs: context.input.outputs, statements: context.input.statements };

		const inputPorts = context.inputNode!.getOutputs(context.manager);
		const states = new Map<string, string>();
		const statements = [...context.input.statements];

		for (const edge of feedbackEdges) {
			const name = edge.inputPort;
			const state = context.ctx.createVariable();
			const initial = context.input.outputs[name];

			states.set(name, state);
			statements.push(
				`var ${state}: array<${getWGSLType(inputPorts[name]!)}, 2>;`,
				`${state}[0] = ${initial};`,
				`${state}[1] = ${initial};`
			);
		}

		const iterationIndex = context.ctx.createVariable();
		const readIndex = context.ctx.createVariable();
		const writeIndex = context.ctx.createVariable();

		const iterationInput = {
			outputs: {
				...context.input.outputs,
				...Object.fromEntries([...states].map(([name, state]) => [name, `${state}[${readIndex}]`]))
			},
			statements: []
		};

		const body = await compileGroupBody(context, iterationInput, ["iterationCount"]);
		const loop = [
			`for (var ${iterationIndex}: u32 = 0u; ${iterationIndex} < u32(${iterationCount}); ${iterationIndex}++) {`,
			`\tlet ${readIndex} = ${iterationIndex} % 2u;`,
			`\tlet ${writeIndex} = (${iterationIndex} + 1u) % 2u;`,
			...body.statements.map(statement => `\t${statement}`),
			...feedbackEdges.map(edge => `\t${states.get(edge.inputPort)}[${writeIndex}] = ${body.outputs[edge.inputPort]};`),
			"}"
		].join("\n");

		statements.push(loop);

		const outputs = { ...context.input.outputs };
		for (const [name, state] of states)
			outputs[name] = `${state}[u32(${iterationCount}) % 2u]`;

		return { outputs, statements };
	}
}

import type { CompileContext } from "../../context";
import { ValueType } from "../../types";
import type { GraphManager } from "../graph-manager";
import { Node, type CompiledNode, type NodePorts } from "./node";

export class SimulationInputNode extends Node<{ iterationCount?: number }> {
	protected override deserializeProps(props: { iterationCount?: number }) {
		return { iterationCount: 1, ...props };
	}

	public override getInputs(manager: GraphManager): NodePorts {
		const graph = manager.getGraph(this.graphId);
		const ports: NodePorts = { iterationCount: ValueType };

		for (const edge of graph.edges.filter(edge => edge.target === this.id)) {
			const source = graph.getNode(edge.source)!;
			ports[`${source.type}_${source.id}`] = source.getOutputs(manager)[edge.outputPort]!;
		}

		return ports;
	}

	public override getOutputs(manager: GraphManager): NodePorts {
		return this.getInputs(manager);
	}

	public override compile(_ctx: CompileContext, inputs: Record<string, string>): CompiledNode {
		const value = this.props.iterationCount ?? 1;
		const literal = Number.isInteger(value) ? `${value}.0` : `${value}`;

		return {
			outputs: {
				...inputs,
				iterationCount: inputs["iterationCount"] ?? literal
			},
			statements: []
		};
	}
}

export class SimulationOutputNode extends Node {
	private getInputNode(manager: GraphManager): SimulationInputNode {
		const graph = manager.getGraph(this.graphId);
		const group = graph.groups.find(group => group.nodes.includes(this.id))!;
		return graph.nodes.find(node => group.nodes.includes(node.id) && group.inputNodeType && node instanceof group.inputNodeType) as SimulationInputNode;
	}

	public override getInputs(manager: GraphManager): NodePorts {
		return this.getInputNode(manager).getOutputs(manager);
	}

	public override getOutputs(manager: GraphManager): NodePorts {
		return this.getInputs(manager);
	}

	public override compile(_ctx: CompileContext, inputs: Record<string, string>): CompiledNode {
		return { outputs: inputs, statements: [] };
	}
}

import type { GraphManager } from "../graph-manager";
import { Node, type NodePorts } from "./node";

export class GroupInputNode<P extends {} = {}> extends Node<GroupNodeProps<P>> {
	public override getInputs(manager: GraphManager) {
		const graph = manager.getGraph(this.graphId);
		const ports: NodePorts = {};

		for (const edge of graph.edges.filter(edge => edge.target === this.id)) {
			const source = graph.getNode(edge.source)!;
			ports[`${source.type}_${source.id}`] = source.getOutputs(manager)[edge.outputPort]!;
		}

		return ports;
	}

	public override getOutputs(manager: GraphManager): NodePorts {
		return this.getInputs(manager);
	}
}

export class GroupOutputNode<P extends {} = {}> extends Node<GroupNodeProps<P>> {
	public override getInputs(manager: GraphManager): NodePorts {
		const graph = manager.getGraph(this.graphId);
		const ports: NodePorts = {};

		for (const edge of graph.edges.filter(edge => edge.target === this.id)) {
			const source = graph.getNode(edge.source)!;
			ports[`${source.type}_${source.id}`] = source.getOutputs(manager)[edge.outputPort]!;
		}

		return ports;
	}

	public override getOutputs(manager: GraphManager): NodePorts {
		return this.getInputs(manager);
	}
}

export type GroupNodeProps<P extends {} = {}> = { groupId: number } & P;
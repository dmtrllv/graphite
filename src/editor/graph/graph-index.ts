import type { GraphNode } from "./nodes/node";
import type { NodeEdge } from "../graph";

export class GraphIndex {
	private incoming = new Map<number, Map<string, NodeEdge>>();
	private outgoing = new Map<number, Map<string, Set<NodeEdge>>>();

	public add(edge: NodeEdge): void {
		let incoming = this.incoming.get(edge.target.id);

		if (!incoming) {
			incoming = new Map();
			this.incoming.set(edge.target.id, incoming);
		}

		incoming.set(edge.targetInput, edge);

		let outputs = this.outgoing.get(edge.source.id);

		if (!outputs) {
			outputs = new Map();
			this.outgoing.set(edge.source.id, outputs);
		}

		let edges = outputs.get(edge.sourceOutput);

		if (!edges) {
			edges = new Set();
			outputs.set(edge.sourceOutput, edges);
		}

		edges.add(edge);
	}

	public remove(edge: NodeEdge): void {
		const incoming = this.incoming.get(edge.target.id);

		if (incoming?.get(edge.targetInput) === edge) {
			incoming.delete(edge.targetInput);

			if (incoming.size === 0)
				this.incoming.delete(edge.target.id);
		}

		const outputs = this.outgoing.get(edge.source.id);
		const edges = outputs?.get(edge.sourceOutput);

		if (edges) {
			edges.delete(edge);

			if (edges.size === 0)
				outputs!.delete(edge.sourceOutput);

			if (outputs!.size === 0)
				this.outgoing.delete(edge.source.id);
		}
	}

	public getInputEdge(node: GraphNode, input: string): NodeEdge | undefined {
		return this.incoming.get(node.id)?.get(input);
	}

	public getOutputEdges(node: GraphNode, output: string): NodeEdge[] {
		return [...(this.outgoing.get(node.id)?.get(output) ?? [])];
	}

	public getConnectedEdges(node: GraphNode): NodeEdge[] {
		const edges = new Set<NodeEdge>();

		for (const edge of this.incoming.get(node.id)?.values() ?? [])
			edges.add(edge);

		for (const outputs of this.outgoing.get(node.id)?.values() ?? []) {
			for (const edge of outputs)
				edges.add(edge);
		}

		return [...edges];
	}

	public clear() {
		this.incoming.clear();
		this.outgoing.clear();
	}
}

export type GraphIndexJson = {
	incoming: Record<number, Record<string, NodeEdge>>,
	outgoing: Record<number, Record<string, Set<NodeEdge>>>,
}
import type { GraphNode } from "./nodes/node";
import type { NodeEdge } from "./graph";

export class GraphIndex {
	private incoming = new Map<GraphNode, Map<string, NodeEdge>>();
	private outgoing = new Map<GraphNode, Map<string, Set<NodeEdge>>>();

	public add(edge: NodeEdge): void {
		let incoming = this.incoming.get(edge.target);

		if (!incoming) {
			incoming = new Map();
			this.incoming.set(edge.target, incoming);
		}

		incoming.set(edge.targetInput, edge);

		let outputs = this.outgoing.get(edge.source);

		if (!outputs) {
			outputs = new Map();
			this.outgoing.set(edge.source, outputs);
		}

		let edges = outputs.get(edge.sourceOutput);

		if (!edges) {
			edges = new Set();
			outputs.set(edge.sourceOutput, edges);
		}

		edges.add(edge);
	}

	public remove(edge: NodeEdge): void {
		const incoming = this.incoming.get(edge.target);

		if (incoming?.get(edge.targetInput) === edge) {
			incoming.delete(edge.targetInput);

			if (incoming.size === 0)
				this.incoming.delete(edge.target);
		}

		const outputs = this.outgoing.get(edge.source);
		const edges = outputs?.get(edge.sourceOutput);

		if (edges) {
			edges.delete(edge);

			if (edges.size === 0)
				outputs!.delete(edge.sourceOutput);

			if (outputs!.size === 0)
				this.outgoing.delete(edge.source);
		}
	}

	public getInputEdge(node: GraphNode, input: string): NodeEdge | undefined {
		return this.incoming.get(node)?.get(input);
	}

	public getOutputEdges(node: GraphNode, output: string): NodeEdge[] {
		return [...(this.outgoing.get(node)?.get(output) ?? [])];
	}

	public getConnectedEdges(node: GraphNode): NodeEdge[] {
		const edges = new Set<NodeEdge>();

		for (const edge of this.incoming.get(node)?.values() ?? [])
			edges.add(edge);

		for (const outputs of this.outgoing.get(node)?.values() ?? []) {
			for (const edge of outputs)
				edges.add(edge);
		}

		return [...edges];
	}
}

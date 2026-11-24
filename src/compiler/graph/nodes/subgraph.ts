import type { SubGraph } from "../subgraph";
import { Node } from "./node";

export const isSubGraphNode = (node: Node): node is SubGraphNode<any> => node instanceof SubGraphNode;

export class SubGraphNode<T extends SubGraph> extends Node {
	public readonly graph: T;

	public override get inputs() {
		return this.graph.inputs;
	}

	public override get outputs() {
		return this.graph.outputs;
	}

	public constructor(id: number, graph: T) {
		super(id);
		this.graph = graph;
	}
}

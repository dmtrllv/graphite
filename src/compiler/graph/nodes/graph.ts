import type { Graph, GraphInputName } from "../graph";
import { Node } from "./node";

export class GraphOutputNode<T extends Graph> extends Node {
	public readonly graph: T;

	public override get outputs() {
		return this.graph.outputs;
	}

	public constructor(id: number, graph: T) {
		super(id);
		this.graph = graph;
	}
}

export class GraphInputNode<T extends Graph> extends Node {
	public readonly graph: T;
	public readonly inputName: string | number | symbol;

	public override get inputs() {
		return this.graph.inputs;
	}

	public constructor(id: number, graph: T, inputName: GraphInputName<T>) {
		super(id);
		this.graph = graph;
		this.inputName = inputName;
	}
}
import type { GraphInputName } from "../graph";
import type { SubGraph } from "../subgraph";
import { Node } from "./node";

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

export class SubGraphOutputNode<T extends SubGraph> extends Node {
	public readonly graph: T;

	public override get outputs() {
		return this.graph.outputs;
	}

	public constructor(id: number, graph: T) {
		super(id);
		this.graph = graph;
	}
}

export class SubGraphInputNode<T extends SubGraph> extends Node {
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
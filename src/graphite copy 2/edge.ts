import type { GraphManager } from "./manager";
import type { InputPort, Node, OutputPort } from "./node";
import type { Type } from "./types";

export class Edge<T extends Type = Type, Source extends OutputPort<Node<any>, any, T> = OutputPort<Node<any>, any, T>, Target extends InputPort<Node<any>, any, T> = InputPort<Node<any>, any, T>> {
	private readonly manager: GraphManager;

	public readonly id: number;
	public readonly outputPort: Source;
	public readonly inputPort: Target;

	public constructor(id: number, manager: GraphManager, outputPort: Source, inputPort: Target) {
		this.id = id;
		this.manager = manager;
		this.outputPort = outputPort;
		this.inputPort = inputPort;
	}

	public disconnect() {
		this.manager.disconnect(this);
	}
}
import type { GraphManager } from "./manager";
import type { InputPort, OutputPort } from "./port";
import type { Type } from "./types";

export class Edge<T extends Type = Type> {
	public readonly id: number;
	public readonly source: OutputPort<any, any, T>;
	public readonly target: InputPort<any, any, T>;
	private readonly manager: GraphManager;

	public constructor(id: number, manager: GraphManager, source: OutputPort<any, any, T>, target: InputPort<any, any, T>) {
		this.id = id;
		this.manager = manager;
		this.source = source;
		this.target = target;
	}

	public disconnect() {
		this.manager.disconnect(this);
	}
}
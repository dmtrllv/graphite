import type { GraphManager } from "./manager";
import type { Node } from "./node";

export class InputPort<T extends Node, K extends keyof T["inputTypes"], U extends T["inputTypes"][K]> {
	public readonly manager: GraphManager;
	public readonly node: Node<{}>;
	public readonly key: K;

	public get type(): U {
		throw new Error("TODO")
	}

	public constructor(manager: GraphManager, node: Node, key: K) {
		this.manager = manager;
		this.node = node;
		this.key = key;
	}
}

export class OutputPort<T extends Node, K extends keyof T["outputTypes"], U extends T["outputTypes"][K]> {
	public readonly manager: GraphManager;
	public readonly node: Node<{}>;
	public readonly key: K;

	public get type(): U {
		throw new Error("TODO")
	}

	public constructor(manager: GraphManager, node: Node, key: K) {
		this.manager = manager;
		this.node = node;
		this.key = key;
	}

	public connect(inputPort: InputPort<any, any, U>) {
		
	}
}
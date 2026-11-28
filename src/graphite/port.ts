import type { Edge } from "./edge";
import type { GraphManager } from "./manager";
import type { Node, NodeInputKeys, NodeInputTypes, NodeOutputKeys, NodeOutputTypes } from "./node";

export class InputPort<T extends Node, K extends NodeInputKeys<T>, U extends NodeInputTypes<T>[K]> {
	public readonly manager: GraphManager;
	public readonly node: Node<{}>;
	public readonly key: K;

	public get type(): U {
		if (!(this.key in this.node.inputTypes))
			throw new Error(`${this} is not a valid input port!`);
		return this.node.inputTypes[this.key] as any;
	}

	public get edge(): Edge<U> | null {
		return this.manager.getNodeInputEdge(this.node, this.key.toString()) as Edge<U>;
	}

	public constructor(manager: GraphManager, node: Node, key: K) {
		this.manager = manager;
		this.node = node;
		this.key = key;
	}

	public toString() {
		return `${this.node.type}.${this.key.toString()}`;
	}
}

export class OutputPort<T extends Node, K extends NodeOutputKeys<T>, U extends NodeOutputTypes<T>[K]> {
	public readonly manager: GraphManager;
	public readonly node: Node<{}>;
	public readonly key: K;

	public get type(): U {
		if (!(this.key in this.node.outputTypes))
			throw new Error(`${this} is not a valid output port!`)
		return this.node.outputTypes[this.key] as any;
	}

	public get edges(): Edge<U>[] {
		return this.manager.getNodeOutputEdges(this.node, this.key.toString()) as Edge<U>[];
	}

	public constructor(manager: GraphManager, node: Node, key: K) {
		this.manager = manager;
		this.node = node;
		this.key = key;
	}

	public connect(inputPort: InputPort<any, any, U>) {
		this.manager.connect(this, inputPort);
	}

	public toString() {
		return `${this.node.type}.${this.key.toString()}`;
	}
}
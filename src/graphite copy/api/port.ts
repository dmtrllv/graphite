import type { GraphManager } from "../manager";
import type { Node as InternalNode } from "../nodes";
import type { Type } from "../types";

export abstract class Port<K, T extends Type, IOType = "input" | "output"> {
	public abstract get ioType(): IOType;

	manager: GraphManager;
	node: InternalNode<any>;
	key: K;
	type: Type;
	
	public constructor(manager: GraphManager, node: InternalNode, key: K, type: T) {
		this.manager = manager;
		this.node = node;
		this.key = key;
		this.type = type;
	}
}

export class InputPort<K, T extends Type> extends Port<K, T, "input"> {
	public override get ioType(): "input" {
		return "input";
	}
}

export class OutputPort<K, T extends Type> extends Port<K, T, "output"> {
	public override get ioType(): "output" {
		return "output";
	}
}
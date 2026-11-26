import { InputPort, Node, OutputPort, type NodeInputTypes, type NodeOutputTypes } from "../node";
import type { SubGraph } from "../subgraph";
import type { Type } from "../types";

export class SubGraphNode<T extends SubGraph> extends Node<SubGraphNode<T>, { graph: T }> {
	public override get inputTypes(): this["props"]["graph"]["inputTypes"] {
		return this.props.graph.inputTypes;
	}

	public override get outputTypes(): this["props"]["graph"]["outputTypes"] {
		return this.props.graph.outputTypes;;
	}

	public getInput<This extends Node<this, { graph: T }>, K extends keyof NodeInputTypes<This> & string, U extends NodeInputTypes<This>[K]>(this: This, key: string, type: U): InputPort<This, K, U>;
	public getInput<This extends Node<this, { graph: T }>, U extends Type>(this: This, key: string, type: U): InputPort<any, any, U>;
	public getInput<This extends Node<this, { graph: T }>>(this: This, key: string, type?: any): InputPort<This, any, any> {
		throw new Error("Method not implemented.");
	}

	public getOutput<This extends Node<This, { graph: T }>, K extends keyof NodeOutputTypes<This> & string, U extends NodeOutputTypes<This>[K]>(this: This, key: string, type: U): OutputPort<This, K, U>;
	public getOutput<This extends Node<This, { graph: T }>, U extends Type>(this: This, key: string, type: U): OutputPort<any, any, U>;
	public getOutput<This extends Node<This, { graph: T }>>(this: This, key: string, type?: any): OutputPort<This, any, any> {
		throw new Error("Method not implemented.");
	}
}
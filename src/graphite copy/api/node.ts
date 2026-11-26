import type { Node as InternalNode, NodeProps, NodeType } from "../nodes";
import { Graph } from "./graph";
import { Ref } from "./ref";

export class Node<T extends InternalNode<P> = InternalNode, P extends {} = any> extends Ref<T> {
	public get id(): number { return this.data.id; }
	public get graphId(): number { return this.data.graphId; }
	public get props(): Readonly<NodeProps<P>> { return this.data.props; }
	public get graph(): Graph { return new Graph(this.manager, this.manager.getGraph(this.graphId)); }
	public get type(): NodeType<T> { return this.data.constructor as NodeType<T, any>; }

	public get inputs(): NodeInputPorts<T> {
		return {} as any;
	}

	public remove() {
		const graph = this.manager.getGraph(this.graphId);
		this.manager.removeNode(graph, this.data);
	}

	//public connect<K extends keyof ReturnType<T["getInputs"]>, Target extends InternalNode>(outputKey: K, target: Node<Target>, inputKey: MatchingInputKey<Target, ReturnType<T["getInputs"]>[K]>) {
	//	const graph = this.manager.getGraph(this.graphId);
	//	const targetNode = graph.getNode(target.id);
	//	this.manager.connect(graph, this.data, outputKey, targetNode, inputKey as string);
	//	throw new Error("Method not implemented.");
	//}
}

export type NodeInputPorts<T extends InternalNode<any>> = ReturnType<T["getInputs"]>;
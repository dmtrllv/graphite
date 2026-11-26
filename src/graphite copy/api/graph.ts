
import type { Type } from "../types";
import type { GraphNodeType, Graph as InternalGraph } from "../graph";
import { PassGraph as InternalPassGraph, type PassProps } from "../pass";
import { WorldGraph as InternalWorldGraph } from "../world";
import { Ref } from "./ref";
import { Node } from "./node";
import type { GraphOutputNode, InferNodeProps, NodeType } from "../nodes";

export class Graph<T extends InternalGraph<any> = any> extends Ref<T> {
	public get nodes() {
		return this.data.nodes.map(n => new Node(this.manager, n))
	}

	public get name() {
		return this.data.name;
	}

	public get outputNode(): Node<GraphOutputNode<T>> {
		return new Node(this.manager, this.data.outputNode) as Node<GraphOutputNode<T>>;
	}
	
	public addNode<U extends GraphNodeType<T>, P extends InferNodeProps<U>>(type: NodeType<U, P>, props: P): Node<U> {
		return new Node(this.manager, this.manager.addNode(this.data, type, props));
	}
}


export class PassGraph<T extends InternalPassGraph<any> = any> extends Graph<T> {
	public setInput(key: string, type: Type) {
		this.manager.updateGraphProps(this.data, "inputs", {
			...this.data.props.outputs,
			[key]: type,
		});
	}

	public setOutput(key: string, type: Type) {
		this.manager.updateGraphProps(this.data, "outputs", {
			...this.data.props.outputs,
			[key]: type,
		});
	}
}
export class WorldGraph extends PassGraph<InternalWorldGraph> {
	public get passes() {
		return this.manager.getGraphs(InternalPassGraph).filter(g => !(g instanceof WorldGraph));
	}

	public addPass(name: string, { inputs = {}, outputs = {} }: Partial<PassProps> = {}) {
		return this.manager.createGraph(InternalPassGraph, name, { inputs, outputs });
	}
}

import { Graph, type GraphNodeType, type MatchingNodeInputPortNames } from "./graph";
import { DEFAULT_NODES, GraphInputNode, Node, type NodeType } from "./nodes";

export class SubGraph extends Graph {
	public override get nodeTypes(): NodeType<any, any>[] {
		return [
			...DEFAULT_NODES,
			GraphInputNode
		];
	}



	public override addNode<U extends NodeType<Node, Args>, Args extends any[]>(type: U, ...args: Args): InstanceType<U> {

		return super.addNode(type, ...args);
	}

	public override removeNode(node: GraphNodeType<this>): void {

		return super.removeEdge(node);
	}

	public override connect<A extends GraphNodeType<this>, K extends keyof A["outputs"], B extends GraphNodeType<this>>(sourceNode: A, sourceOutputPort: K, target: B, targetInputPort: MatchingNodeInputPortNames<B, A, K>) {

		return super.connect(sourceNode, sourceOutputPort, target, targetInputPort);
	}
}
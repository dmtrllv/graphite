import { Graph, type GraphNodeType, type MatchingNodeInputPortNames, type NodeType } from "./graph";
import type { GraphManager } from "./graph-manager";
import { DEFAULT_NODES, Node, SubGraphInputNode, SubGraphOutputNode } from "./nodes";

export class SubGraph extends Graph {
	public readonly outputNode: Node;

	public override get nodeTypes(): NodeType<any, any>[] {
		return [
			...DEFAULT_NODES,
			SubGraphInputNode
		];
	}

	public constructor(id: number, name: string, manager: GraphManager) {
		super(id, name, manager);
		this.outputNode = this.addNode(SubGraphOutputNode, this);
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
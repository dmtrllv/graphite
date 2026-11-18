import type { Graph } from "../graph";
import { type GraphNode, type GraphNodeType } from "../nodes";
import type { Vec2 } from "../types";
import type { GraphAction } from "./action";

export class AddNodeAction implements GraphAction {
	public node: GraphNode | null = null;

	public constructor(
		private graph: Graph, 
		private type: GraphNodeType<any>, 
		private position: Vec2
	) { }

	public execute(): void {
		if (this.node)
			this.graph.restoreNode(this.node);
		else
			this.node = this.graph.addNode(this.type, this.position);
	}

	public undo(): void {
		if (this.node)
			this.graph.removeNode(this.node);
	}
}
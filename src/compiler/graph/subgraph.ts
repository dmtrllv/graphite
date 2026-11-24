import { Graph } from "./graph";
import { DEFAULT_NODES, GraphInputNode } from "./nodes";

export class SubGraph extends Graph {
	public override get nodeTypes() {
		return [
			...DEFAULT_NODES,
			GraphInputNode
		];
	}
}
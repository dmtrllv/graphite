import { Graph } from "./graph";
import { DEFAULT_NODES, GraphInputNode } from "./nodes";

/**
 * A subgraph is like a regular function it takes some inputs and produces some outputs
 * It can be instantiated/called in any kind of graph at any place.
 */
export class SubGraph extends Graph {
	public override get nodeTypes() {
		return [
			...DEFAULT_NODES,
			GraphInputNode
		];
	}
}
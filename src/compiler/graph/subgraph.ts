import { assert } from "../../utils";
import { Graph } from "./graph";
import { DEFAULT_NODES, GraphInputNode, SimulationOutputNode } from "./nodes";

export class SubGraph extends Graph {
	public override get nodeTypes() {
		return [
			...DEFAULT_NODES,
			GraphInputNode
		];
	}

	public get inputNode() {
		const node = assert.notNull(this.getNode(1));
		assert(() => node instanceof SimulationOutputNode, `Second node is not a SimulationOutputNode!`);
		return node;
	}
}
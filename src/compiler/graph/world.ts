import { Graph } from "./graph";
import type { GraphManager } from "./graph-manager";
import { DEFAULT_NODES } from "./nodes";

export class WorldGraph extends Graph {
	public override get nodeTypes() {
		return [
			...DEFAULT_NODES,
		];
	}

	public constructor(manager: GraphManager) {
		super(0, "World", manager);
	}
}
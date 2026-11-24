import { Graph } from "./graph";
import { DEFAULT_NODES } from "./nodes";

export class WorldGraph extends Graph {
	public override get nodeTypes() {
		return [
			...DEFAULT_NODES,
		];
	}
}
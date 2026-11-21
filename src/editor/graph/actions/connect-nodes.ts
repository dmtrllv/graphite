import type { Graph } from "../graph";
import { NodeEdge } from "../edge";
import type { GraphNode } from "../nodes";
import type { EditorAction } from "../../actions";

export class ConnectNodesAction implements EditorAction {
	private created: NodeEdge | null = null;

	public constructor(
		private graph: Graph,
		private source: GraphNode,
		private sourceOutput: string,
		private target: GraphNode,
		private targetInput: string,
		private replaced: NodeEdge | undefined
	) { }

	public execute(): void {
		if (this.created) {
			if (this.replaced)
				this.graph.removeEdge(this.replaced);

			this.graph.restoreEdge(this.created);
			return;
		}

		if (this.replaced)
			this.graph.removeEdge(this.replaced);

		this.created = this.graph.addEdge(this.source, this.sourceOutput, this.target, this.targetInput);

		if (!this.created && this.replaced)
			this.graph.restoreEdge(this.replaced);
	}

	public undo(): void {
		if (this.created)
			this.graph.removeEdge(this.created);

		if (this.replaced)
			this.graph.restoreEdge(this.replaced);
	}
}

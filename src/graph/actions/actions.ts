import type { Graph } from "../graph";
import { NodeEdge } from "../graph";
import type { GraphNode } from "../nodes";
import { Vec2 } from "../types";
import type { GraphAction } from "./action";

export type NodePositionChange = {
	node: GraphNode;
	before: Vec2;
	after: Vec2;
};

export class MoveNodesAction implements GraphAction {
	public constructor(private changes: NodePositionChange[]) { }

	public execute(): void {
		for (const change of this.changes)
			change.node.position.set(change.after);
	}

	public undo(): void {
		for (const change of this.changes)
			change.node.position.set(change.before);
	}
}

export class DeleteEdgesAction implements GraphAction {
	public constructor(private graph: Graph, private edges: NodeEdge[]) { }

	public execute(): void {
		for (const edge of this.edges)
			this.graph.removeEdge(edge);
	}

	public undo(): void {
		for (const edge of this.edges)
			this.graph.restoreEdge(edge);
	}
}

export class ConnectNodesAction implements GraphAction {
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

export class DeleteNodesAction implements GraphAction {
	private edges: NodeEdge[];

	public constructor(private graph: Graph, private nodes: GraphNode[]) {
		this.edges = [...new Set(nodes.flatMap(node => graph.index.getConnectedEdges(node)))];
	}

	public execute(): void {
		for (const node of this.nodes)
			this.graph.removeNode(node);
	}

	public undo(): void {
		for (const node of this.nodes)
			this.graph.restoreNode(node);

		for (const edge of this.edges)
			this.graph.restoreEdge(edge);
	}
}

export class CompositeAction implements GraphAction {
	public constructor(private actions: GraphAction[]) { }

	public execute(): void {
		for (const action of this.actions)
			action.execute();
	}

	public undo(): void {
		for (const action of [...this.actions].reverse())
			action.undo();
	}
}
import { GraphAction } from "./graph-action";
import { Subgraph } from "../graph";
import { SubgraphNode } from "../nodes";
import type { Vec2 } from "../types";
import type { GraphManager } from "../graph-manager";
import type { GraphEditor } from "../editor";
import type { ProjectManager } from "../../project-manager";
import { action } from "../../actions";
import type { GraphViewport } from "../viewport";

@action({ id: "graph.subgraph.create", history: true })
export class CreateSubgraphAction extends GraphAction {
	private readonly manager: GraphManager;
	private readonly position: Vec2;

	private addedGraph: Subgraph | null = null;
	private node: SubgraphNode | null = null;
	private viewport: GraphViewport | null = null;

	public get createdGraph(): Subgraph {
		if (!this.addedGraph)
			throw new Error("Subgraph has not been created!");

		return this.addedGraph;
	}

	public constructor(graphEditor: GraphEditor, projectManager: ProjectManager, position: Vec2) {
		super(graphEditor, projectManager);

		const manager = graphEditor.graph.manager;

		if (!manager)
			throw new Error("Graph does not belong to a GraphManager!");

		this.manager = manager;
		this.position = position;
	}

	public override execute(): void {
		super.execute();
		this.projectManager.openGraph(this.manager.openEditor(this.createdGraph));
	}

	protected executeAction(): void {
		const graph = this.addedGraph ?? this.manager.createSubgraph();
		this.addedGraph = graph;

		if (this.manager.get(graph.id) !== graph)
			this.manager.restore(graph, this.viewport ?? undefined);

		try {
			if (!this.node)
				this.node = this.graphEditor.graph.addNode(SubgraphNode, this.position) as SubgraphNode;
			else
				this.graphEditor.graph.restoreNode(this.node);

			this.node.graphId = graph.id;
		} catch (error) {
			if (this.node && this.graphEditor.graph.nodes.get(this.node.id) === this.node)
				this.graphEditor.graph.removeNode(this.node);

			if (this.manager.get(graph.id) === graph)
				this.manager.removeGraph(graph);

			throw error;
		}
	}

	protected undoAction(): void {
		if (this.addedGraph)
			this.viewport = this.manager.viewports.get(this.addedGraph.id) ?? null;

		if (this.node && this.graphEditor.graph.nodes.get(this.node.id) === this.node)
			this.graphEditor.graph.removeNode(this.node);

		if (this.addedGraph && this.manager.get(this.addedGraph.id) === this.addedGraph)
			this.manager.removeGraph(this.addedGraph);
	}
}

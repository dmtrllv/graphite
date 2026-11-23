import { GraphAction } from "./graph-action";
import { NodeEdge } from "../edge";
import type { GraphNode } from "../nodes";
import type { GraphEditor } from "../editor";
import type { ProjectManager } from "../../project-manager";
import { action } from "../../actions";

@action({ id: "graph.node.connect", history: true })
export class ConnectNodesAction extends GraphAction {
	private created: NodeEdge | null = null;
	private source: GraphNode;
	private sourceOutput: string;
	private target: GraphNode;
	private targetInput: string;
	private replaced: NodeEdge | undefined

	public constructor(graphEditor: GraphEditor, projectManager: ProjectManager, source: GraphNode, sourceOutput: string, target: GraphNode, targetInput: string, replaced: NodeEdge | undefined) {
		super(graphEditor, projectManager);
		this.source = source;
		this.sourceOutput = sourceOutput;
		this.target = target;
		this.targetInput = targetInput;
		this.replaced = replaced;
	}


	protected executeAction(): void {
		if (this.created) {
			if (this.replaced && this.graph.edges.get(this.replaced.id) === this.replaced)
				this.graph.removeEdge(this.replaced);

			try {
				this.graph.restoreEdge(this.created);
			} catch (error) {
				if (this.replaced && !this.graph.edges.has(this.replaced.id))
					this.graph.restoreEdge(this.replaced);

				throw error;
			}

			return;
		}

		this.created = this.graph.addEdge(this.source, this.sourceOutput, this.target, this.targetInput);

		if (!this.created)
			throw new Error("Cannot connect incompatible or unregistered graph nodes!");
	}

	protected undoAction(): void {
		if (this.created && this.graph.edges.get(this.created.id) === this.created)
			this.graph.removeEdge(this.created);

		if (this.replaced && !this.graph.edges.has(this.replaced.id))
			this.graph.restoreEdge(this.replaced);
	}
}
import type { EditorAction } from "../../actions";
import type { GraphEditor } from "../editor";
import type { Graph } from "../graph";
import type { ProjectManager } from "../../project-manager";

export abstract class GraphAction implements EditorAction {
	protected readonly graph: Graph;
	protected readonly graphEditor: GraphEditor;
	protected readonly projectManager: ProjectManager;

	public constructor(graphEditor: GraphEditor, projectManager: ProjectManager) {
		this.graphEditor = graphEditor;
		this.graph = graphEditor.graph;
		this.projectManager = projectManager;
	}

	public execute(): void {
		this.activate();
		this.executeAction();
	}

	public undo(): void {
		this.activate();
		this.undoAction();
	}

	protected activate(): void {
		this.projectManager.activateGraphEditor(this.graphEditor);
	}

	protected abstract executeAction(): void;
	protected abstract undoAction(): void;
}
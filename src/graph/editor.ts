import { observable } from "../reactive";
import type { Graph } from "./graph";
import type { GraphEditorTool } from "./tools/tool";
import { Selection, DraggingEdge, EdgeSlice } from "./editor-state";
import type { GraphNode } from "./nodes";
import { GraphEditorHistory } from "./actions/history";

export class GraphEditor {
	public readonly graph: Graph;
	public readonly history = new GraphEditorHistory();

	@observable
	public accessor selectedNodes: GraphNode[] = [];

	@observable
	public accessor activeTool: GraphEditorTool | null = null;

	@observable
	public accessor selection: Selection | null = null;

	@observable
	public accessor draggingEdge: DraggingEdge | null = null;

	@observable
	public accessor slice: EdgeSlice | null = null;

	public constructor(graph: Graph) {
		this.graph = graph;
	}

	public setTool(tool: GraphEditorTool | null): void {
		this.activeTool?.cancel();
		this.activeTool = tool;
	}
}
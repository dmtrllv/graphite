import { observable } from "../reactive";
import type { Graph } from "./graph";
import type { GraphEditorTool } from "./tools/tool";
import { Selection, DraggingEdge, EdgeSlice } from "./editor-state";
import { GraphNode } from "./nodes";
import { GraphEditorHistory } from "./actions/history";
import { ConnectNodesAction } from "./actions/actions";
import { Vec2 } from "./types";

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
	public accessor edgeCut: EdgeSlice | null = null;

	public constructor(graph: Graph) {
		this.graph = graph;
	}

	public setTool(tool: GraphEditorTool | null): void {
		if (this.activeTool === tool)
			return;

		this.activeTool?.cancel();
		this.activeTool = tool;
	}

	public isSelected(node: GraphNode): boolean {
		return this.selectedNodes.includes(node);
	}

	public beginEdgeDrag(from: "input" | "output", node: GraphNode, key: string, position: Vec2): void {
		this.draggingEdge = new DraggingEdge(from, node, key, position);
	}

	public updateEdgeDrag(position: Vec2): void {
		this.draggingEdge?.mousePosition.set(position);
	}

	public connectDraggingEdge(node: GraphNode, key: string): void {
		const dragging = this.draggingEdge;

		if (!dragging)
			return;

		let source: GraphNode;
		let sourceOutput: string;
		let target: GraphNode;
		let targetInput: string;

		if (dragging.from === "output") {
			source = dragging.node;
			sourceOutput = dragging.key;
			target = node;
			targetInput = key;
		} else {
			source = node;
			sourceOutput = key;
			target = dragging.node;
			targetInput = dragging.key;
		}

		const sourcePort = GraphNodePort(source, sourceOutput, "output");
		const targetPort = GraphNodePort(target, targetInput, "input");

		if (sourcePort && targetPort) {
			const replaced = this.graph.index.getInputEdge(target, targetInput);
			this.history.execute(new ConnectNodesAction(this.graph, source, sourceOutput, target, targetInput, replaced));
		}

		this.draggingEdge = null;
	}

	public cancelEdgeDrag(): void {
		this.draggingEdge = null;
	}
}

const GraphNodePort = (node: GraphNode, key: string, direction: "input" | "output") => {
	return GraphNode.getPort(node, key, direction);
};
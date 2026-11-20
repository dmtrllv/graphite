import { observable } from "@reactive";
import type { Graph } from "./graph";
import type { GraphEditorTool } from "./tools/tool";
import { Selection, DraggingEdge, EdgeSlice } from "./editor-state";
import { GraphNode, type GraphNodeType } from "./nodes";
import { Vec2 } from "./types";
import { GraphEditorHistory, ConnectNodesAction, AddNodeAction, DeleteNodesAction } from "./actions";

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

	public addNode(type: GraphNodeType<any>, position: Vec2): GraphNode {
		const action = new AddNodeAction(this.graph, type, position);
		this.history.execute(action);
		this.selectedNodes = [action.node!];
		return action.node!;
	}

	public removeSelectedNodes(): void {
		if (!this.selectedNodes.length)
			return;

		this.history.execute(new DeleteNodesAction(this.graph, [...this.selectedNodes]));
		this.selectedNodes = [];
	}

	public dispose(): void {
		this.setTool(null);
		this.selectedNodes = [];
		this.selection = null;
		this.draggingEdge = null;
		this.edgeCut = null;
		this.history.clear();
	}
}

const GraphNodePort = (node: GraphNode, key: string, direction: "input" | "output") => {
	return GraphNode.getPort(node, key, direction);
};
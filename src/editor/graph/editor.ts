import { observable } from "@reactive";
import type { Graph } from "./graph";
import type { GraphEditorTool } from "./tools/tool";
import { Selection, DraggingEdge, EdgeSlice } from "./editor-state";
import { GraphNode, type GraphNodeType } from "./nodes";
import { Vec2 } from "./types";
import { GraphViewport } from "./viewport";
import { ConnectNodesAction, AddNodeAction, DeleteNodesAction } from "./actions";
import type { ActionManager } from "../actions";
import type { ProjectManager } from "../project-manager";

@observable
export class GraphEditor {
	public readonly graph: Graph;
	public readonly viewport: GraphViewport;

	public get offset(): Vec2 {
		return this.viewport.offset;
	}

	public get scale(): number {
		return this.viewport.scale;
	}

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

	public readonly actionManager: ActionManager;
	public readonly projectManager: ProjectManager;

	public constructor(graph: Graph, actionManager: ActionManager, projectManager: ProjectManager, viewport: GraphViewport = new GraphViewport()) {
		this.graph = graph;
		this.actionManager = actionManager;
		this.projectManager = projectManager;
		this.viewport = viewport;
	}

	public getCanvasMousePosition(position: Vec2, canvas: HTMLCanvasElement): Vec2 {
		return this.viewport.getCanvasMousePosition(position, canvas);
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

		const sourcePort = GraphNode.getPort(source, sourceOutput, "output");
		const targetPort = GraphNode.getPort(target, targetInput, "input");

		if (sourcePort && targetPort) {
			const replaced = this.graph.index.getInputEdge(target, targetInput);
			this.actionManager.execute(new ConnectNodesAction(this, this.projectManager, source, sourceOutput, target, targetInput, replaced));
		}

		this.draggingEdge = null;
	}

	public cancelEdgeDrag(): void {
		this.draggingEdge = null;
	}

	public addNode(type: GraphNodeType<any>, position: Vec2): GraphNode {
		const action = new AddNodeAction(this, this.projectManager, type, position);
		this.actionManager.execute(action);
		this.selectedNodes = [action.node!];
		return action.node!;
	}

	public removeSelectedNodes(): void {
		const nodes = this.selectedNodes.filter(node => node.graph === this.graph && !this.graph.isOutputNode(node));

		if (!nodes.length)
			return;

		this.actionManager.execute(new DeleteNodesAction(this, this.projectManager, nodes));
		this.selectedNodes = [];
	}

	public dispose(): void {
		this.setTool(null);
		this.selectedNodes = [];
		this.selection = null;
		this.draggingEdge = null;
		this.edgeCut = null;
	}
}

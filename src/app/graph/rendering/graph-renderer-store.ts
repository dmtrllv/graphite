
import { subscribe } from "../../../reactive";
import type { Graph } from "../../../graph";
import type { GraphEditor } from "../../../graph/editor";
import type { GraphNode } from "../../../graph/nodes";
import { GraphLayout } from "./graph-layout";
import { GraphCanvasRenderer } from "./renderer";
import { RenderScheduler } from "./render-scheduler";

export class GraphRendererStore {
	public readonly graph: Graph;
	public readonly editor: GraphEditor;
	public readonly layout = new GraphLayout();
	public readonly renderer = new GraphCanvasRenderer();

	private canvas: HTMLCanvasElement | null = null;
	private scheduler = new RenderScheduler(() => this.render());
	private unsubscribers: (() => void)[] = [];
	private nodeUnsubscribers = new Map<number, () => void>();

	public constructor(editor: GraphEditor) {
		this.editor = editor;
		this.graph = editor.graph;
	}

	public attach(canvas: HTMLCanvasElement): void {
		this.canvas = canvas;

		this.unsubscribers = [
			subscribe(this.graph, { recursive: false } as any, this.invalidate),
			subscribe(this.graph, "offset", { recursive: true }, this.invalidate),
			subscribe(this.graph, "scale", this.invalidate),
			subscribe(this.graph, "structureVersion", this.onStructureChange),
			subscribe(this.editor, "draggingEdge", { recursive: true }, this.invalidate),
			subscribe(this.editor, "slice", { recursive: true }, this.invalidate)
		];

		for (const node of this.graph.nodes.values())
			this.subscribeNode(node);

		this.invalidate();
	}

	public detach(): void {
		for (const unsubscribe of this.unsubscribers)
			unsubscribe();

		for (const unsubscribe of this.nodeUnsubscribers.values())
			unsubscribe();

		this.unsubscribers = [];
		this.nodeUnsubscribers.clear();
		this.canvas = null;
		this.scheduler.dispose();
		this.renderer.clear();
	}

	public invalidate = (): void => {
		this.scheduler.invalidate();
	};

	public updateNode(node: GraphNode): void {
		if (!this.canvas)
			return;

		this.layout.updateNode(node, this.graph, this.canvas);
		this.invalidate();
	}

	public removeNode(node: GraphNode): void {
		this.nodeUnsubscribers.get(node.id)?.();
		this.nodeUnsubscribers.delete(node.id);
		this.layout.removeNode(node);
		this.invalidate();
	}

	private subscribeNode(node: GraphNode): void {
		this.nodeUnsubscribers.get(node.id)?.();

		this.nodeUnsubscribers.set(node.id, subscribe(node, "position", { recursive: true }, () => {
			this.updateNode(node);
		}));

		this.updateNode(node);
	}

	private onStructureChange = (): void => {
		const activeNodes = new Set(this.graph.nodes.keys());

		for (const [id, unsubscribe] of this.nodeUnsubscribers) {
			if (activeNodes.has(id))
				continue;

			unsubscribe();
			this.nodeUnsubscribers.delete(id);
		}

		for (const node of this.graph.nodes.values()) {
			if (!this.nodeUnsubscribers.has(node.id))
				this.subscribeNode(node);
		}

		this.invalidate();
	};

	private render(): void {
		if (!this.canvas)
			return;

		this.renderer.render(this.graph, this.editor, this.canvas, this.layout);
	}
}

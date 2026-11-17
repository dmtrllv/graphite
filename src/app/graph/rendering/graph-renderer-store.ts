
import { subscribe } from "../../../reactive";
import type { Graph } from "../../../graph";
import type { GraphNode } from "../../../graph/nodes";
import { GraphLayout } from "./graph-layout";
import { GraphCanvasRenderer } from "./renderer";
import { RenderScheduler } from "./render-scheduler";

export class GraphRendererStore {
	public readonly graph: Graph;
	public readonly layout = new GraphLayout();
	public readonly renderer = new GraphCanvasRenderer();

	private canvas: HTMLCanvasElement | null = null;
	private scheduler = new RenderScheduler(() => this.render());
	private unsubscriber: () => void = () => { };

	public constructor(graph: Graph) {
		this.graph = graph;
	}

	public attach(canvas: HTMLCanvasElement): void {
		this.canvas = canvas;

		this.unsubscriber = subscribe(this.graph, { recursive: true }, this.invalidate);

		this.invalidate();
	}

	public detach(): void {
		this.unsubscriber();
		this.unsubscriber = () => { };
		this.canvas = null;
		this.scheduler.dispose();
		this.renderer.clear();
	}

	public invalidate = (): void => {
		this.scheduler.invalidate();
	};

	public updateNode(node: GraphNode): void {
		if (!this.canvas) return;

		this.layout.updateNode(node, this.graph, this.canvas);
		this.invalidate();
	}

	public removeNode(node: GraphNode): void {
		this.layout.removeNode(node);
		this.invalidate();
	}

	private render(): void {
		if (!this.canvas) return;
		this.renderer.render(this.graph, this.canvas, this.layout);
	}
}

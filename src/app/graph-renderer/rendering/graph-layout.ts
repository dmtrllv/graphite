import { Vec2, type Graph, type GraphNode } from "../../../graph";

type PortDirection = "input" | "output";

type PortPosition = {
	position: Vec2;
	version: number;
};

export class GraphLayout {
	private ports = new Map<string, PortPosition>();

	private getKey(node: GraphNode, direction: PortDirection, key: string): string {
		return `${node.id}:${direction}:${key}`;
	}

	public updateNode(node: GraphNode, graph: Graph, canvas: HTMLCanvasElement): void {
		const canvasRect = canvas.getBoundingClientRect();

		const update = (elements: Record<string, HTMLDivElement | null>, direction: PortDirection) => {
			for (const [key, element] of Object.entries(elements)) {
				if (!element)
					continue;

				const rect = element.getBoundingClientRect();
				const offset = direction === "input" ? 0.8 : 0.2;

				const position = new Vec2(
					(rect.left + rect.width * offset - canvasRect.left - canvasRect.width / 2 - graph.offset.x) / graph.scale,
					-(rect.top + rect.height / 2 - canvasRect.top - canvasRect.height / 2 + graph.offset.y) / graph.scale
				);

				this.updatePort(node, direction, key, position);
			}
		};

		if (graph.scale <= 0)
			return;

		update(node.inputElements, "input");
		update(node.outputElements, "output");
	}

	private updatePort(node: GraphNode, direction: PortDirection, key: string, position: Vec2): void {
		const id = this.getKey(node, direction, key);
		const port = this.ports.get(id);
		
		if (port && port.position.distance(position) < 0.01)
			return;

		this.ports.set(id, {
			position,
			version: (port?.version ?? 0) + 1
		});
	}

	public getPort(node: GraphNode, direction: PortDirection, key: string): PortPosition | undefined {
		return this.ports.get(this.getKey(node, direction, key));
	}

	public removeNode(node: GraphNode): void {
		const prefix = `${node.id}:`;

		for (const key of this.ports.keys()) {
			if (key.startsWith(prefix))
				this.ports.delete(key);
		}
	}
}

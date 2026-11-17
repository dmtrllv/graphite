import { Vec2, type Graph, type GraphNode } from "../../../graph";

export type PortDirection = "input" | "output";

export type PortPosition = {
	position: Vec2;
	version: number;
};

export class GraphLayout {
	private ports = new Map<string, PortPosition>();
	private portElements = new Map<string, HTMLDivElement>();
	private nodeElements = new Map<number, { node: GraphNode; element: HTMLDivElement }>();

	private getPortKey(node: GraphNode, direction: PortDirection, key: string): string {
		return `${node.id}:${direction}:${key}`;
	}

	public setNodeElement(node: GraphNode, element: HTMLDivElement | null): void {
		if (element)
			this.nodeElements.set(node.id, { node, element });
		else
			this.nodeElements.delete(node.id);
	}

	public setPortElement(node: GraphNode, direction: PortDirection, key: string, element: HTMLDivElement | null): void {
		const id = this.getPortKey(node, direction, key);

		if (element)
			this.portElements.set(id, element);
		else {
			this.portElements.delete(id);
			this.ports.delete(id);
		}
	}

	public updateNode(node: GraphNode, graph: Graph, canvas: HTMLCanvasElement): boolean {
		if (graph.scale <= 0)
			return false;

		const canvasRect = canvas.getBoundingClientRect();
		let changed = false;

		for (const direction of ["input", "output"] as const) {
			const prefix = `${node.id}:${direction}:`;

			for (const [id, element] of this.portElements) {
				if (!id.startsWith(prefix))
					continue;

				const key = id.slice(prefix.length);
				const rect = element.getBoundingClientRect();
				const offset = direction === "input" ? 0.8 : 0.2;

				const position = new Vec2(
					(rect.left + rect.width * offset - canvasRect.left - canvasRect.width / 2 - graph.offset.x) / graph.scale,
					-(rect.top + rect.height / 2 - canvasRect.top - canvasRect.height / 2 + graph.offset.y) / graph.scale
				);

				changed = this.updatePort(node, direction, key, position) || changed;
			}
		}

		return changed;
	}

	private updatePort(node: GraphNode, direction: PortDirection, key: string, position: Vec2): boolean {
		const id = this.getPortKey(node, direction, key);
		const port = this.ports.get(id);

		if (port && port.position.distance(position) < 0.01)
			return false;

		this.ports.set(id, {
			position,
			version: (port?.version ?? 0) + 1
		});

		return true;
	}

	public getPort(node: GraphNode, direction: PortDirection, key: string): PortPosition | undefined {
		return this.ports.get(this.getPortKey(node, direction, key));
	}

	public getNodesInRect(left: number, top: number, right: number, bottom: number): GraphNode[] {
		const x1 = Math.min(left, right);
		const x2 = Math.max(left, right);
		const y1 = Math.min(top, bottom);
		const y2 = Math.max(top, bottom);
		const result: GraphNode[] = [];

		for (const { node, element } of this.nodeElements.values()) {
			const rect = element.getBoundingClientRect();

			if (rect.right < x1 || rect.left > x2 || rect.bottom < y1 || rect.top > y2)
				continue;

			result.push(node);
		}

		return result;
	}

	public getNodeAt(x: number, y: number): GraphNode | undefined {
		for (const { node, element } of this.nodeElements.values()) {
			const rect = element.getBoundingClientRect();

			if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
				return node;
		}

		return undefined;
	}

	public removeNode(node: GraphNode): void {
		this.nodeElements.delete(node.id);

		const prefix = `${node.id}:`;

		for (const key of this.ports.keys()) {
			if (key.startsWith(prefix))
				this.ports.delete(key);
		}

		for (const key of this.portElements.keys()) {
			if (key.startsWith(prefix))
				this.portElements.delete(key);
		}
	}

	public getPortAt(x: number, y: number): { node: GraphNode; direction: PortDirection; key: string } | undefined {
		for (const [id, element] of this.portElements) {
			const rect = element.getBoundingClientRect();

			if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom)
				continue;

			const [nodeId, direction, ...parts] = id.split(":");
			const node = this.nodeElements.get(Number(nodeId))?.node;

			if (node && (direction === "input" || direction === "output"))
				return { node, direction, key: parts.join(":") };
		}

		return undefined;
	}
}
import { Vec2, type Graph, type GraphNode } from "../../../graph";

export type PortDirection = "input" | "output";

export type PortPosition = {
	position: Vec2;
	version: number;
};

type PortElement = {
	node: GraphNode;
	direction: PortDirection;
	key: string;
	element: HTMLDivElement;
};

export class GraphLayout {
	private ports = new Map<string, PortPosition>();
	private portVersions = new Map<string, number>();
	private portElements = new Map<string, PortElement>();
	private nodeElements = new Map<number, { node: GraphNode; element: HTMLDivElement }>();
	private hoveredPort: HTMLDivElement | null = null;

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

		if (element) {
			this.portElements.set(id, { node, direction, key, element });
		} else {
			const port = this.portElements.get(id);

			if (this.hoveredPort === port?.element)
				this.setHoveredPort();

			this.portElements.delete(id);
			this.ports.delete(id);
		}
	}

	public setHoveredPort(port?: { node: GraphNode; direction: PortDirection; key: string }): void {
		const element = port ? this.portElements.get(this.getPortKey(port.node, port.direction, port.key))?.element ?? null : null;

		if (this.hoveredPort === element)
			return;

		this.hoveredPort?.classList.remove("hovered");
		this.hoveredPort = element;
		this.hoveredPort?.classList.add("hovered");
	}

	public updateNode(node: GraphNode, graph: Graph, canvas: HTMLCanvasElement): boolean {
		if (graph.scale <= 0)
			return false;

		const canvasRect = canvas.getBoundingClientRect();
		let changed = false;

		for (const port of this.portElements.values()) {
			if (port.node !== node)
				continue;

			const rect = port.element.getBoundingClientRect();
			const offset = port.direction === "input" ? 0.8 : 0.2;

			const position = new Vec2(
				(rect.left + rect.width * offset - canvasRect.left - canvasRect.width / 2 - graph.offset.x) / graph.scale,
				-(rect.top + rect.height / 2 - canvasRect.top - canvasRect.height / 2 + graph.offset.y) / graph.scale
			);

			changed = this.updatePort(node, port.direction, port.key, position) || changed;
		}

		return changed;
	}

	public updateAll(graph: Graph, canvas: HTMLCanvasElement): boolean {
		let changed = false;

		for (const { node } of this.nodeElements.values())
			changed = this.updateNode(node, graph, canvas) || changed;

		return changed;
	}

	private updatePort(node: GraphNode, direction: PortDirection, key: string, position: Vec2): boolean {
		const id = this.getPortKey(node, direction, key);
		const port = this.ports.get(id);

		if (port && port.position.distance(position) < 0.01)
			return false;

		const version = (this.portVersions.get(id) ?? 0) + 1;
		this.portVersions.set(id, version);
		this.ports.set(id, { position, version });

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

		for (const [id, port] of this.portElements) {
			if (port.node !== node)
				continue;

			this.portElements.delete(id);
			this.ports.delete(id);
		}
	}

	public getPortAt(x: number, y: number): { node: GraphNode; direction: PortDirection; key: string } | undefined {
		for (const port of this.portElements.values()) {
			const rect = port.element.getBoundingClientRect();

			if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
				return { node: port.node, direction: port.direction, key: port.key };
		}

		return undefined;
	}
}

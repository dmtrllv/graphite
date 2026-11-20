import { Vec2 } from "../types";
import type { GraphEditor } from "../editor";
import type { GraphNode } from "../nodes";

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
	private nodePorts = new Map<number, Set<string>>();
	private nodeElements = new Map<number, { node: GraphNode; element: HTMLDivElement }>();
	private hoveredPort: HTMLDivElement | null = null;
	private nodeDragOffsets = new Map<number, Vec2>();

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

			let ports = this.nodePorts.get(node.id);

			if (!ports) {
				ports = new Set();
				this.nodePorts.set(node.id, ports);
			}

			ports.add(id);
		} else {
			const port = this.portElements.get(id);

			if (this.hoveredPort === port?.element)
				this.setHoveredPort();

			this.portElements.delete(id);
			this.ports.delete(id);

			const ports = this.nodePorts.get(node.id);
			ports?.delete(id);

			if (!ports?.size)
				this.nodePorts.delete(node.id);
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

	public updateNode(node: GraphNode, editor: GraphEditor, canvas: HTMLCanvasElement): boolean {
		const viewport = editor.viewport;

		if (viewport.scale <= 0)
			return false;

		const canvasRect = canvas.getBoundingClientRect();
		const ports = this.nodePorts.get(node.id);

		if (!ports)
			return false;

		let changed = false;

		for (const id of ports) {
			const port = this.portElements.get(id);

			if (!port || port.node !== node)
				continue;

			const rect = port.element.getBoundingClientRect();
			const offset = port.direction === "input" ? 0.8 : 0.2;

			const position = new Vec2(
				(rect.left + rect.width * offset - canvasRect.left - canvasRect.width / 2 - viewport.offset.x) / viewport.scale,
				-(rect.top + rect.height / 2 - canvasRect.top - canvasRect.height / 2 + viewport.offset.y) / viewport.scale
			);

			changed = this.updatePort(node, port.direction, port.key, position) || changed;
		}

		return changed;
	}

	public updateAll(editor: GraphEditor, canvas: HTMLCanvasElement): boolean {
		let changed = false;

		for (const { node } of this.nodeElements.values())
			changed = this.updateNode(node, editor, canvas) || changed;

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

		const ports = this.nodePorts.get(node.id);

		if (!ports)
			return;

		for (const id of ports) {
			const port = this.portElements.get(id);

			if (this.hoveredPort === port?.element)
				this.setHoveredPort();

			this.portElements.delete(id);
			this.ports.delete(id);
		}

		this.nodePorts.delete(node.id);
		this.nodeDragOffsets.delete(node.id);
	}

	public getPortAt(x: number, y: number): { node: GraphNode; direction: PortDirection; key: string } | undefined {
		for (const port of this.portElements.values()) {
			const rect = port.element.getBoundingClientRect();

			if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)
				return { node: port.node, direction: port.direction, key: port.key };
		}

		return undefined;
	}

	public setNodeDragOffset(node: GraphNode, offset: Vec2 | null): void {
		const previous = this.nodeDragOffsets.get(node.id) ?? new Vec2();
		const current = offset ?? new Vec2();
		const delta = new Vec2(current.x - previous.x, current.y - previous.y);
		const element = this.nodeElements.get(node.id)?.element;

		if (offset) {
			this.nodeDragOffsets.set(node.id, current);
			element?.style.setProperty("--drag-x", `${current.x}px`);
			element?.style.setProperty("--drag-y", `${-current.y}px`);
		} else {
			this.nodeDragOffsets.delete(node.id);
			element?.style.removeProperty("--drag-x");
			element?.style.removeProperty("--drag-y");
		}

		if (delta.x === 0 && delta.y === 0)
			return;

		const ports = this.nodePorts.get(node.id);

		if (!ports)
			return;

		for (const id of ports) {
			const port = this.ports.get(id);
			const element = this.portElements.get(id);

			if (!port || !element)
				continue;

			this.updatePort(node, element.direction, element.key, new Vec2(
				port.position.x + delta.x,
				port.position.y + delta.y
			));
		}
	}

	public clear(): void {
		this.hoveredPort?.classList.remove("hovered");
		this.hoveredPort = null;

		for (const { element } of this.nodeElements.values()) {
			element.style.removeProperty("--drag-x");
			element.style.removeProperty("--drag-y");
		}

		this.ports.clear();
		this.portVersions.clear();
		this.portElements.clear();
		this.nodePorts.clear();
		this.nodeElements.clear();
		this.nodeDragOffsets.clear();
	}
}

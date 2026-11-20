import { observable } from "@reactive";
import type { GraphNode } from "./nodes";
import { Vec2 } from "./types";

@observable
export class Selection {
	@observable
	public accessor downPos: Vec2;

	@observable
	public accessor mousePos: Vec2;

	public constructor(downPos: Vec2, mousePos: Vec2) {
		this.downPos = downPos;
		this.mousePos = mousePos;
	}
}

@observable
export class EdgeSlice {
	@observable
	public accessor downPos: Vec2;

	@observable
	public accessor mousePos: Vec2;

	public constructor(downPos: Vec2, mousePos: Vec2) {
		this.downPos = downPos;
		this.mousePos = mousePos;
	}
}

@observable
export class DraggingEdge {
	@observable
	public accessor from: "input" | "output";

	@observable
	public accessor node: GraphNode;

	@observable
	public accessor key: string;

	@observable
	public accessor mousePosition: Vec2;

	public constructor(from: "input" | "output", node: GraphNode, key: string, mousePosition: Vec2) {
		this.from = from;
		this.node = node;
		this.key = key;
		this.mousePosition = mousePosition;
	}
}

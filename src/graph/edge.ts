import { observable } from "../reactive";
import type { GraphNode } from "./nodes";

export class NodeEdge {
	public readonly id: number;

	@observable
	public accessor source: GraphNode;

	@observable
	public accessor sourceOutput: string;

	@observable
	public accessor target: GraphNode;

	@observable
	public accessor targetInput: string;

	public constructor(id: number, source: GraphNode, sourceOutput: string, target: GraphNode, targetInput: string) {
		this.id = id;
		this.source = source;
		this.sourceOutput = sourceOutput;
		this.target = target;
		this.targetInput = targetInput;
	}
}
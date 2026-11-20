import { observable } from "@reactive";
import { Serializable, serializable, reference } from "../serializable";
import { GraphNode } from "./nodes";

@serializable({ type: "graph:edge", create: data => new NodeEdge(data.id, null!, "", null!, "") })
export class NodeEdge extends Serializable {
	@serializable(Number)
	public readonly id: number;

	@observable
	@serializable(reference(GraphNode))
	public accessor source: GraphNode;

	@observable
	@serializable(String)
	public accessor sourceOutput: string;

	@observable
	@serializable(reference(GraphNode))
	public accessor target: GraphNode;

	@observable
	@serializable(String)
	public accessor targetInput: string;

	public constructor(id: number, source: GraphNode, sourceOutput: string, target: GraphNode, targetInput: string) {
		super();
		this.id = id;
		this.source = source;
		this.sourceOutput = sourceOutput;
		this.target = target;
		this.targetInput = targetInput;
	}
}
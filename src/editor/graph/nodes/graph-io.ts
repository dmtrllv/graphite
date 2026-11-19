import { observable } from "@reactive";
import { GraphNode, GraphNodeCategory } from "./node";

abstract class GraphIONode extends GraphNode {
	@observable
	public accessor interfaceId = "";

	public get interfacePort() {
		return [...this.graph.inputs, ...this.graph.outputs].find(port => port.id === this.interfaceId);
	}

	public override serializeData(): Record<string, unknown> {
		return { interfaceId: this.interfaceId };
	}

	public override restoreData(data: Record<string, unknown>): void {
		if (typeof data["interfaceId"] === "string")
			this.interfaceId = data["interfaceId"];
	}
}

@GraphNode.register(GraphNodeCategory.SubGraph, "Graph Input")
export class GraphInputNode extends GraphIONode {
	public override getInterface() {
		const port = this.graph.inputs.find(item => item.id === this.interfaceId);

		return {
			inputs: [],
			outputs: port ? [{
				key: port.id,
				name: port.name,
				direction: "output" as const,
				value: port.type
			}] : [],
			options: []
		};
	}
}

@GraphNode.register(GraphNodeCategory.SubGraph, "Graph Output")
export class GraphOutputNode extends GraphIONode {
	public override getInterface() {
		const port = this.graph.outputs.find(item => item.id === this.interfaceId);

		return {
			inputs: port ? [{
				key: port.id,
				name: port.name,
				direction: "input" as const,
				value: port.type
			}] : [],
			outputs: [],
			options: []
		};
	}
}
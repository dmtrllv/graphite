import { observable } from "@reactive";
import { Graph, PassGraph, Subgraph, WorldGraph } from "../graph";
import { GraphNode, GraphNodeCategory } from "./node";
import { serializable } from "../../serializable";

@observable
abstract class GraphIONode extends GraphNode {
	@observable
	@serializable(String)
	public accessor interfaceId = "";

	public get interfacePort() {
		return [...this.graph.inputs, ...this.graph.outputs].find(port => port.id === this.interfaceId);
	}
}

@GraphNode.register(GraphNodeCategory.SubGraph, "Graph Input")
export class GraphInputNode extends GraphIONode {
	public override getInterface() {
		if (!(this.graph instanceof Subgraph))
			return { inputs: [], outputs: [], options: [] };

		const port = this.graph.inputs.find(item => item.id === this.interfaceId);

		return {
			inputs: [],
			outputs: port ? [{
				key: port.id,
				name: port.name,
				direction: "output" as const,
				value: port.type,
				editable: false
			}] : [],
			options: []
		};
	}
}

@GraphNode.register(GraphNodeCategory.Unknown, "Graph Output")
export class GraphOutputNode extends GraphNode {
	public override getInterface() {
		if (!(this.graph instanceof Subgraph))
			return { inputs: [], outputs: [], options: [] };

		return {
			inputs: this.graph.outputs.map(port => ({
				key: port.id,
				name: port.name,
				direction: "input" as const,
				value: port.type,
				editable: false
			})),
			outputs: [],
			options: []
		};
	}
}

@GraphNode.register(GraphNodeCategory.Unknown, "World Output")
export class WorldOutputNode extends GraphNode {
	public override getInterface() {
		if (!(this.graph instanceof WorldGraph))
			return { inputs: [], outputs: [], options: [] };

		return {
			inputs: this.graph.outputs.map(port => ({
				key: port.id,
				name: port.name,
				direction: "input" as const,
				value: port.type,
				editable: false
			})),
			outputs: [],
			options: []
		};
	}
}

@GraphNode.register(GraphNodeCategory.Unknown, "Pass Output")
export class PassOutputNode extends GraphNode {
	public override getInterface() {
		if (!(this.graph instanceof PassGraph))
			return { inputs: [], outputs: [], options: [] };

		return {
			inputs: [...this.graph.passOutputs.values()].map(port => ({
				key: port.id,
				name: port.name,
				direction: "input" as const,
				value: port.type,
				editable: false
			})),
			outputs: [],
			options: []
		};
	}
}

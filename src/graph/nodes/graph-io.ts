import { observable } from "../../reactive";
import { F32, Type } from "../types";
import { GraphNode } from "./node";

abstract class GraphIONode extends GraphNode {
	@observable
	public accessor interfaceId: string = crypto.randomUUID();

	@observable
	public accessor interfaceName = "Value";

	@observable
	public accessor value: Type = new F32(0);

	public override serializeData(): Record<string, unknown> {
		return {
			interfaceId: this.interfaceId,
			interfaceName: this.interfaceName,
			value: this.value
		};
	}

	public override restoreData(data: Record<string, unknown>): void {
		if (typeof data["interfaceId"] === "string")
			this.interfaceId = data["interfaceId"];

		if (typeof data["interfaceName"] === "string")
			this.interfaceName = data["interfaceName"];

		if (data["value"] instanceof Type)
			this.value = data["value"];
	}
}

@GraphNode.register("Graph Input")
export class GraphInputNode extends GraphIONode {
	public override getInterface() {
		return {
			inputs: [],
			outputs: [{
				key: this.interfaceId,
				name: this.interfaceName,
				direction: "output" as const,
				value: this.value
			}],
			options: []
		};
	}
}

@GraphNode.register("Graph Output")
export class GraphOutputNode extends GraphIONode {
	public override getInterface() {
		return {
			inputs: [{
				key: this.interfaceId,
				name: this.interfaceName,
				direction: "input" as const,
				value: this.value
			}],
			outputs: [],
			options: []
		};
	}
}

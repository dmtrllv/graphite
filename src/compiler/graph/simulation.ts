import { Group } from "./group";
import { SimulationInputNode, SimulationOutputNode } from "./nodes";

export class SimulationGroup extends Group {
	public override get inputNodeType() {
		return SimulationInputNode;
	}

	public override get outputNodeType() {
		return SimulationOutputNode;
	}
}

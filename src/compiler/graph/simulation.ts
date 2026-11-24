import { Group } from "./group";
import { SimulationInputNode, SimulationOutputNode } from "./nodes";

/**
 * A `SimulationGroup` takes any node provided to the `SimulationInputNode`.
 * The `SimulationOutputNode` will reflect/mirror the provided inputs to the `SimulationInputNode`.
 * Nodes inside this group cannot have edges/connections to nodes outside the group. It must go trough the `SimulationOutputNode`.
 */
export class SimulationGroup extends Group {
	public override get inputNodeType() {
		return SimulationInputNode;
	}

	public override get outputNodeType() {
		return SimulationOutputNode;
	}
}

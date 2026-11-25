import { GroupInputNode, GroupOutputNode } from "./group";

export class SimulationInputNode extends GroupInputNode<{ iterationCount: number }> {}

export class SimulationOutputNode extends GroupOutputNode<{}> {}

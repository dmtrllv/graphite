import { F32, Scalar } from "../types";
import { GraphNode, output } from "./node";

@GraphNode.register("Value")
export class ScalarNode extends GraphNode {
	@output()
	accessor value: Scalar = new F32(0);
}
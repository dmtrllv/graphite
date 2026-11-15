import { F32, Scalar } from "../types";
import { GraphNode, option } from "./node";

@GraphNode.register("Value")
export class ScalarNode extends GraphNode {
	@option()
	accessor value: Scalar = new F32(0);
}
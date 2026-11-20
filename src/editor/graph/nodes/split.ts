import { serializable } from "../../serializable";
import { F32, Vec4, Vector } from "../types";
import { GraphNode, GraphNodeCategory, input, output } from "./node";

@GraphNode.register(GraphNodeCategory.Math, "Split")
export class SplitNode extends GraphNode {
	@input(false)
	@serializable(Vector)
	accessor input: Vector = new Vec4();

	@output(false)
	@serializable(F32)
	accessor x: F32 = new F32(0);

	@output(false)
	@serializable(F32)
	accessor y: F32 = new F32(0);

	@output(false)
	@serializable(F32)
	accessor z: F32 = new F32(0);

	@output(false)
	@serializable(F32)
	accessor w: F32 = new F32(0);
}
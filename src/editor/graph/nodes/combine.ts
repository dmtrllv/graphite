import { serializable } from "../../serializable";
import { F32, Vec4, Vector } from "../types";
import { GraphNode, GraphNodeCategory, input, output } from "./node";

@GraphNode.register(GraphNodeCategory.Math, "Combine")
export class SombineNode extends GraphNode {
	@output(false)
	@serializable(Vector)
	accessor output: Vector = new Vec4();

	@input()
	@serializable(F32)
	accessor x: F32 = new F32(0);

	@input()
	@serializable(F32)
	accessor y: F32 = new F32(0);

	@input()
	@serializable(F32)
	accessor z: F32 = new F32(0);

	@input()
	@serializable(F32)
	accessor w: F32 = new F32(1);
}
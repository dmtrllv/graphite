import { Bool, F16, F32, I32, U32 } from "../types";
import { GraphNode, GraphNodeCategory, output } from "./node";
import { serializable } from "../../serializable";

@GraphNode.register(GraphNodeCategory.Value, "F16")
export class F16Node extends GraphNode {
	@output()
	@serializable(F16)
	accessor value = new F16(0);
}

@GraphNode.register(GraphNodeCategory.Value, "F32")
export class F32Node extends GraphNode {
	@output()
	@serializable(F32)
	accessor value = new F32(0);
}

@GraphNode.register(GraphNodeCategory.Value, "I32")
export class I32Node extends GraphNode {
	@output()
	@serializable(I32)
	accessor value = new I32(0);
}

@GraphNode.register(GraphNodeCategory.Value, "U32")
export class U32Node extends GraphNode {
	@output()
	@serializable(U32)
	accessor value = new U32(0);
}

@GraphNode.register(GraphNodeCategory.Value, "Bool")
export class BoolNode extends GraphNode {
	@output()
	@serializable(Bool)
	accessor value = new Bool(false);
}
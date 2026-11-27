import { BinOpNode } from "@graphite/nodes";
import { registerNodeView } from "./registry";

export const BinOpView = registerNodeView(BinOpNode, () => {
	return null;
})
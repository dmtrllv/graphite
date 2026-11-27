import { ValueNode } from "@graphite/nodes";
import { registerNodeView } from "./registry";
import type { Node } from "@graphite/node";
import { useEffect, useState, useSyncExternalStore } from "react";
import { NumberInput } from "../../../inputs";

const useNodeState = <T extends {}>(node: Node<T>): T => {
	useSyncExternalStore((onChange) => node.on("state-changed", onChange), node.getRevision);
	return node.state;
};

export const ValueView = registerNodeView(ValueNode, ({ node }) => {
	useNodeState(node);

	return (
		<NumberInput label="value" value={node.state.value} onChange={value => node.update({ value })} />
	);
});
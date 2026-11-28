import { BinOp, BinOpNode } from "@graphite/nodes";
import { registerNodeView } from "./registry";
import { NodeInput, NodeOutput, useNodeState } from "./node";
import { NumberInput, EnumInput } from "../../../ui/inputs";

export const BinOpView = registerNodeView(BinOpNode, ({ node }) => {
	const [state, _, updater] = useNodeState(node);

	return (
		<>
			<NodeOutput port={node.outputPorts.value} hidePortName>
				<EnumInput type={BinOp} value={state.op} onChange={updater("op")} />
			</NodeOutput>
			<NodeInput port={node.inputPorts.a}>
				<NumberInput label="a" disabled={!!node.inputPorts.a.edge} value={state.a} onChange={updater("a")} />
			</NodeInput>
			<NodeInput port={node.inputPorts.b}>
				<NumberInput label="b" disabled={!!node.inputPorts.b.edge} value={state.b} onChange={updater("b")} />
			</NodeInput>
		</>
	);
});
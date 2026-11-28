import { ValueNode, VectorCombine, VectorSplit } from "@graphite/nodes";
import { registerNodeView } from "./registry";
import { NumberInput } from "../../../inputs";
import { NodeInput, NodeOutput, useNodeState } from "./node";

export const ValueView = registerNodeView(ValueNode, ({ node }) => {
	useNodeState(node);

	return (
		<NodeOutput port={node.outputPorts.value} hidePortName>
			<NumberInput label="value" value={node.state.value} onChange={value => node.update({ value })} />
		</NodeOutput>
	);
});


export const VectorSplitNode = registerNodeView(VectorSplit, ({ node }) => {
	useNodeState(node);

	return (
		<>
			<NodeOutput port={node.outputPorts.x} />
			<NodeOutput port={node.outputPorts.y} />
			<NodeOutput port={node.outputPorts.z} />
			<NodeOutput port={node.outputPorts.w} />
			<NodeInput port={node.inputPorts.vector}>
				Vector input
			</NodeInput>
		</>
	);
});


export const VectorCombineView = registerNodeView(VectorCombine, ({ node }) => {
	const [state, _, set] = useNodeState(node);
	
	return (
		<>
			<NodeOutput port={node.outputPorts.vector} />
			<NodeInput port={node.inputPorts.x}>
				<NumberInput label="x" disabled={!!node.inputPorts.x.edge} value={state.x} onChange={set("x")} />
			</NodeInput>
			<NodeInput port={node.inputPorts.y}>
				<NumberInput label="y" disabled={!!node.inputPorts.y.edge} value={state.y} onChange={set("y")} />
			</NodeInput>
			<NodeInput port={node.inputPorts.z}>
				<NumberInput label="z" disabled={!!node.inputPorts.z.edge} value={state.z} onChange={set("z")} />
			</NodeInput>
			<NodeInput port={node.inputPorts.w}>
				<NumberInput label="w" disabled={!!node.inputPorts.w.edge} value={state.w} onChange={set("w")} />
			</NodeInput>
		</>
	);
});


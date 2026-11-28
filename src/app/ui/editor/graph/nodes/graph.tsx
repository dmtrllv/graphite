import { GraphInputNode, GraphNode, GraphOutputNode } from "@graphite/nodes";
import { registerNodeView } from "./registry";
import { mapChildren } from "@utils";
import { NumberInput } from "../../../inputs";
import { NodeInput, NodeOutput } from "./node";

export const GraphInputValueView = registerNodeView(GraphInputNode, ({ node }) => {
	return <NodeOutput port={node.getOutputPort("value")} />;
});

export const GraphOutputValuesView = registerNodeView(GraphOutputNode, ({ node }) => {
	return (
		<>
			{mapChildren(node.inputPorts, (_, k) => (
				<NodeInput port={node.getInputPort(k)}>
					{k}
				</NodeInput>
			))}
		</>
	);
});

export const GraphNodeView = registerNodeView(GraphNode, ({ node }) => {
	const inputs = node.state.inputs;

	const update = (key: string, value: any) => node.update({ inputs: { ...inputs, [key]: value } });

	return (
		<>
			{mapChildren(node.outputPorts, (port) => <NodeOutput port={port} />)}
			{mapChildren(node.inputPorts, (port, k) => {
				const value = inputs[k as keyof typeof inputs];
				return (
					<NodeInput port={port}>
						<NodeInputField type={port.type.name} disabled={!!port.edge} label={k} value={value} onChange={v => update(k, v)} />
					</NodeInput>
				);
			})}
		</>
	);
});

const NodeInputField = ({ type, ...props }: NodeInputFielProps) => {
	switch (type) {
		case "f32": return <NumberInput {...props} />;
		default: return null;
	}
};

type NodeInputFielProps<T = any> = {
	type: string;
	onChange: (value: T) => any;
	value: T;
	label: string;
	disabled: boolean;
};

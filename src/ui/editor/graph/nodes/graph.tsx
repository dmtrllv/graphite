import { GraphInputNode, GraphNode, GraphOutputNode } from "@graphite/nodes";
import { registerNodeView } from "./registry";
import { cn, mapChildren } from "@utils";
import { NumberInput } from "../../../inputs";

export const GraphInputValueView = registerNodeView(GraphInputNode, ({ node }) => {
	const inputs = node.state.graph.inputs;
	const k = node.state.key;

	const val = inputs[k as keyof typeof inputs]!;

	return (
		<div className={cn("output", {}, val.name)}>
			{k} ({val.name})
			<div className="port" />
		</div>
	);
});
export const GraphOutputValuesView = registerNodeView(GraphOutputNode, ({ node }) => {
	return (
		<div>
			{mapChildren(node.inputs, (v, k) => (
				<div className={cn("input", {}, v.type.name)}>
					{k} ({v.type.name})
					<div className="port" />
				</div>
			))}
		</div>
	);
});
export const GraphNodeView = registerNodeView(GraphNode, ({ node }) => {
	const inputs = node.state.inputs;

	const update = (key: string, value: any) => node.update({ inputs: { ...inputs, [key]: value } });

	return (
		<div>
			{mapChildren(node.outputs, (v, k) => (
				<div className={cn("input", {}, v.type.name)}>
					{k} ({v.type.name})
					<div className="port" />
				</div>
			))}
			{mapChildren(node.inputs, (v, k) => {
				const val = inputs[k as keyof typeof inputs];
				const isConnected = false;
				let jsx = null;
				switch (v.type.name) {
					case "f32":
						jsx = <NumberInput disabled={isConnected} label={k} value={val} onChange={v => update(k, v)} />;
						break;
					case "vector":
						jsx = <div>todo vector</div>;
						break;
					case "matrix":
						jsx = <div>todo matrix</div>;
						break;
				}
				return (
					<div className={cn("output", {}, v.type.name)}>
						{jsx}
						<div className="port" />
					</div>
				);
			})}
		</div>
	);
});
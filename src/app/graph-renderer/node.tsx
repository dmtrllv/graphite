import React, { useMemo } from "react";
import { GraphNode, NodeProp, ScalarNode, type NodeOption } from "../../graph";
import { useObservable } from "../../reactive/hook";
import { mapChildren } from "../../utils";

export const GraphNodeView = ({ node }: { node: GraphNode }) => {
	node = useObservable(node);

	const inputs = GraphNode.getInputs(node.constructor);
	const options = GraphNode.getOptions(node.constructor);
	const outputs = GraphNode.getOutputs(node.constructor);

	const style = useMemo<React.CSSProperties>(() => {
		return {
			left: `calc(50% + ${node.position.x}px)`,
			top: `calc(50% + ${node.position.y}px)`,
			transform: `translate(-50%, -50%)`
		}
	}, [node.position.x, node.position.x]);

	return (
		<div className="graph-node" style={style}>
			<div className="name">{node.name}</div>
			<div className="body">
				{inputs && <div className="outputs">{mapChildren(outputs, (k, v) => <NodeOutputView key={k} node={node} output={v} />)}</div>}
				{options && <div className="options">{mapChildren(options, (k, v) => <NodeOptionView key={k} node={node} option={v} />)}</div>}
				{inputs && <div className="inputs">{mapChildren(inputs, (k, v) => <NodeInputView key={k} node={node} input={v} />)}</div>}
			</div>
		</div>
	);
};

const NodeInputView = ({ }: { node: GraphNode, input: NodeProp }) => {
	return (
		<div className="input">

		</div>
	);
};

const NodeOutputView = ({ node }: { node: GraphNode, output: NodeProp }) => {

	return (
		<div className={`output ${node}`}>
			<div className="name">{node.name}</div>
			<div className="point"></div>
		</div>
	);
};

const NodeOptionView = ({ node, option }: { node: GraphNode, option: NodeOption }) => {
	if (node instanceof ScalarNode) {
		return <ScalarInput node={node} withInput={option.withInput} name={option.name} />
	}

	return null;

};

const ScalarInput = ({ node, name, withInput }: { node: ScalarNode, name: string, withInput: boolean | undefined }) => {
	useObservable(node.value);

	const hasInput = !!node.getInputEdge(name);

	const setValue = (value: string) => {
		node.value.value = +value;
	};

	return (
		<div className="option">
			{withInput && <div className="input-point" />}
			<input type="number" value={node.value.value} placeholder={name} disabled={hasInput} onChange={e => setValue(e.target.value)} />
		</div>
	);
};
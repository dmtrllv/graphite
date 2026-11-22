import { type GraphEditor, type Graph, GraphInputNode, GraphNodeCategory, Subgraph, SubgraphNode, Vec2, type GraphNodeType } from "@editor";
import { mapChildren } from "@utils";
import React from "react";
import type { NodePickerState } from "./hooks";

type NodePickerProps = {
	editor: GraphEditor;
	graph: Graph;
	state: NonNullable<NodePickerState>;
	nodeTypes: [string, GraphNodeType][];
	availableSubgraphs: Subgraph[];
	onClose: () => void;
	onCreateSubgraph: (editor: GraphEditor, position: Vec2) => void;
};

export const NodePicker = ({ editor, graph, state, nodeTypes, availableSubgraphs, onClose, onCreateSubgraph }: NodePickerProps) => {
	const addSubgraph = (definition: Subgraph) => {
		const node = editor.addNode(SubgraphNode, state.position) as SubgraphNode;
		node.graphId = definition.id;
		onClose();
	};

	const addNode = (type: GraphNodeType) => {
		editor.addNode(type, state.position);
		onClose();
	};

	const addInput = (id: string) => {
		const node = editor.addNode(GraphInputNode, state.position) as GraphInputNode;
		node.interfaceId = id;
		onClose();
	};

	return (
		<div className="node-picker" style={{ left: state.x, top: state.y }}
			onPointerDown={event => event.stopPropagation()}
			onWheel={event => event.stopPropagation()}>
			{availableSubgraphs.map(definition => (
				<div key={definition.id} className="node-picker-item" onClick={() => addSubgraph(definition)}>
					{definition.name}
				</div>
			))}
			{mapChildren(GraphNodeCategory, (_, category): any => {
				if (category === GraphNodeCategory.Unknown)
					return null;

				return (
					<React.Fragment key={category}>
						<div>{category}</div>
						{nodeTypes.map(([name, type]) => (type as any).category === category && (
							<div key={name} className="node-picker-item" onClick={() => addNode(type)}>
								{name}
							</div>
						))}
					</React.Fragment>
				);
			})}
			{graph instanceof Subgraph && graph.inputs.length > 0 && <div>Sub Graph Inputs</div>}
			{graph instanceof Subgraph && graph.inputs.map(port => (
				<div key={`input-${port.id}`} className="node-picker-item" onClick={() => addInput(port.id)}>
					Input: {port.name}
				</div>
			))}
			<div className="node-picker-item" onClick={() => {
				onCreateSubgraph(editor, state.position);
				onClose();
			}}>
				New Subgraph
			</div>
		</div>
	);
};
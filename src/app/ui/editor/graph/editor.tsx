import type { Graph } from "@graphite/graph";
//import { mapChildren } from "@utils";
//import { NodeView } from "./nodes";
//import { useRef, useState, useSyncExternalStore } from "react";
//import { useMouseMove } from "@hooks";

import "./styles/editor.scss";

//const useGraphStore = (graph: Graph) => useSyncExternalStore(graph.subscribe, graph.getRevision);

//const useGraphEditor = (graph: Graph) => {
//	useGraphStore(graph);

//	const [scale, setScale] = useState(1);

//	const canvas = useRef<HTMLCanvasElement>(null);

//	return {
//		canvas,
//	};
//};

export const GraphEditorView = ({ graph }: GraphEditorProps) => {
	//const { position, startMouseMove } = useMouseMove([0, 0], undefined, undefined, undefined, 1);

	return (
		<div className="graph-editor">
			{/*<div className="renderer" style={{ scale }} onMouseDown={startMouseMove}>
				<canvas />
				<div className="nodes" style={{ left: position[0], top: position[1] }}>
					{mapChildren(graph.nodes, (node) => <NodeView node={node} />)}
				</div>
			</div>*/}
		</div>
	);
};

export type GraphEditorProps = {
	graph: Graph;
};
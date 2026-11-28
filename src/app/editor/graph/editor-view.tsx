import type { Graph } from "@graphite/graph";
import { mapChildren } from "@utils";
import { NodeView } from "./nodes";
import { useRef, useState, useSyncExternalStore } from "react";
import { useMouseMove } from "../../ui/hooks";
import { Window } from "../../layout";

import "./styles/editor.scss";

const useGraphStore = (graph: Graph) => useSyncExternalStore(graph.subscribe, graph.getRevision);

const GraphEditorView = ({ graph }: GraphEditorProps) => {
	useGraphStore(graph);

	const [scale, _setScale] = useState(1);

	const canvas = useRef<HTMLCanvasElement>(null);

	const { position, startMouseMove } = useMouseMove([0, 0], undefined, undefined, undefined, 1);

	return (
		<div className="graph-editor">
			<div className="renderer" style={{ scale }} onMouseDown={startMouseMove}>
				<canvas ref={canvas} />
				<div className="nodes" style={{ left: position[0], top: position[1] }}>
					{mapChildren(graph.nodes, (node) => <NodeView node={node} />)}
				</div>
			</div>
		</div>
	);
};

export type GraphEditorProps = {
	graph: Graph;
};

export const GraphEditorWindow = Window.create({
	title: "Graph",
}, GraphEditorView)
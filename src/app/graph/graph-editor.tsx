import type { GraphEditor } from "../../graph/editor";
import { useObservable } from "../../reactive";
import { GraphRenderer } from "./graph-renderer";
import { GraphProperties } from "./graph-properties";

import "./styles/graph.scss";

type GraphEditorProps = {
	editor: GraphEditor;
	onCreateSubgraph: (editor: GraphEditor, position: import("../../graph").Vec2) => void;
};

export const GraphEditorView = ({ editor, onCreateSubgraph }: GraphEditorProps) => {
	useObservable(editor, { recursive: false });

	return (
		<div className="graph-editor">
			<GraphRenderer key={editor.graph.id} editor={editor} onCreateSubgraph={onCreateSubgraph} />
			<GraphProperties graph={editor.graph} />
		</div>
	);
};
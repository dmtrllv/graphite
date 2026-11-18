import type { GraphEditor } from "../../graph/editor";
import { useObservable } from "../../reactive";
import { GraphRenderer } from "./graph-renderer";
import { GraphProperties } from "./graph-properties";
import type { ProjectManager } from "../../editor/project-manager";
import type { Vec2 } from "../../graph";

import "./styles/graph.scss";

type GraphEditorProps = {
	editor: GraphEditor;
	onCreateSubgraph: (editor: GraphEditor, position: Vec2) => void;
	projectManager: ProjectManager;
};

export const GraphEditorView = ({ editor, onCreateSubgraph, projectManager }: GraphEditorProps) => {
	useObservable(editor, { recursive: false });

	return (
		<div className="graph-editor">
			<GraphRenderer projectManager={projectManager} key={editor.graph.id} editor={editor} onCreateSubgraph={onCreateSubgraph} />
			<GraphProperties graph={editor.graph} />
		</div>
	);
};
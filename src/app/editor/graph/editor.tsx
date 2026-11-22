import type { GraphEditor, Vec2 } from "@editor";
import { useObservable } from "@reactive";
import { GraphRenderer } from "./renderer";
import { GraphProperties } from "./properties";
import type { ProjectManager } from "@editor";

import "./styles/editor.scss";

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
			<GraphProperties graph={editor.graph} onOpenGraph={graph => projectManager.openGraph(projectManager.activeProject.graphManager.openEditor(graph))} />
		</div>
	);
};
import type { GraphEditor } from "../../graph/editor";
import { useObservable } from "../../reactive";
import { GraphRenderer } from "./graph-renderer";

export const GraphEditorView = ({ editor }: { editor: GraphEditor }) => {
	useObservable(editor, { recursive: false });

	return (
		<div className="graph-editor">
			<GraphRenderer editor={editor} />
		</div>
	);
};
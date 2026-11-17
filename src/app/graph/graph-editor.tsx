import type { GraphEditor } from "../../graph/editor";
import { useObservable } from "../../reactive";
import { GraphRenderer } from "./graph-renderer";

export const GrahpEditor = ({ editor }: { editor: GraphEditor }) => {
	useObservable(editor, { recursive: false });

	return (
		<div className="graph-editor">
			<GraphRenderer graph={editor.graph} />
		</div>
	);
};
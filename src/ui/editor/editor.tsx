import type { Graphite } from "@graphite";
import { GraphEditor } from "./graph/editor";

import "./styles/editor.scss";

export const Editor = ({ app }: EditorProps) => {
	return (
		<div className="editor">
			<GraphEditor graph={app.getGraph("Mul Add")!} />
		</div>
	);
};

export type EditorProps = {
	app: Graphite
};
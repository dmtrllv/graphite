import type { Graphite } from "@graphite";
import { GraphEditor } from "./graph/editor";

export const Editor = ({ app }: EditorProps) => {
	return (
		<div>
			<h1>hi</h1>
			<GraphEditor graph={app.world} />
		</div>
	);
};

export type EditorProps = {
	app: Graphite
};
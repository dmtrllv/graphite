import type { Editor } from "../../editor";
import { MenuBarView } from "./menubar";
import { Workspace } from "./workspace";

import "./styles/editor.scss";

export const EditorView = ({ editor }: { editor: Editor }) => {
	return (
		<div className="editor">
			<MenuBarView menubar={editor.menubar} />
			<Workspace editor={editor} />
		</div>
	);
};
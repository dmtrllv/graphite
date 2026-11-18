import type { Editor } from "../../editor";
import { MenuBarView } from "./menubar";
import { Workspace } from "./workspace";
import { useObservable } from "../../reactive";

import "./styles/editor.scss";

export const EditorView = ({ editor }: { editor: Editor }) => {
	const projectManager = useObservable(editor.projectManager, { recursive: true });
	const preferences = projectManager.activeProject.settings.preferences;

	return (
		<div className="editor">
			<MenuBarView menubar={editor.menubar} autoHide={preferences.autoHideMenu} />
			<Workspace editor={editor} />
		</div>
	);
};
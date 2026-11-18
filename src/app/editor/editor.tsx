import type { Editor } from "../../editor";
import { MenuBarView } from "./menubar";
import { Workspace } from "./workspace";
import { useObservable } from "../../reactive";

import "./styles/editor.scss";

export const EditorView = ({ editor }: { editor: Editor }) => {
	const settings = useObservable(editor.projectManager).activeProject.settings;
	const preferences = useObservable(settings.preferences, { recursive: true });
	console.log(preferences.autoHideMenu);

	return (
		<div className="editor">
			<MenuBarView menubar={editor.menubar} autoHide={preferences.autoHideMenu} />
			<Workspace editor={editor} />
		</div>
	);
};
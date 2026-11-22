import type { Editor } from "../../editor";
import { MenuBarView } from "./menubar";
import { Workspace } from "./layout";
import { useObservable } from "@reactive";
import { useEvent } from "@hooks";
import { createContext, useContext } from "react";

import "./styles/editor.scss";

const EditorContext = createContext<Editor | null>(null);

export const useEditor = (): Editor => {
	const editor = useContext(EditorContext);
	if (!editor)
		throw new Error(`No editor context provided!`);
	return editor;
};

export const EditorView = ({ editor }: { editor: Editor }) => {
	const projectManager = useObservable(editor.projectManager, { recursive: true });
	const preferences = useObservable(projectManager.activeProject.settings.preferences);

	useEvent("keydown", event => editor.actionManager.handleKeyDown(event), undefined, [editor]);

	return (
		<EditorContext.Provider value={editor}>
			<div className="editor">
				<MenuBarView menubar={editor.menubar} autoHide={preferences.autoHideMenu} />
				<Workspace editor={editor} />
			</div>
		</EditorContext.Provider>
	);
};
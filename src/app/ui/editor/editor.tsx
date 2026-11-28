import type { Editor } from "../../editor";
import { useApp } from "../../app";
import { createContext, useContext } from "react";
import { Workspace } from "./layout";
import { MenuBarView } from "./menubar";

import "./styles/editor.scss";

const EditorContext = createContext<Editor | null>(null);

export const useEditor = (): Editor => {
	const editor = useContext(EditorContext);
	if (!editor)
		throw new Error(`No editor context provided!`);
	return editor;
};

export const EditorView = () => {
	const editor = useApp().editor;

	//useEvent("keydown", event => editor.actions.handleKeyDown(event), undefined, [editor]);

	return (
		<EditorContext.Provider value={editor}>
			<div className="editor">
				<MenuBarView menubar={editor.menubar} />
				<Workspace editor={editor} />
			</div>
		</EditorContext.Provider>
	);
};
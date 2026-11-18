import type { Editor } from "../../editor";
import { useObservable } from "../../reactive";
import { LayoutView } from "./layout";
import { MenuBarView } from "./menubar";

import "./styles/editor.scss";

export const EditorView = ({ editor }: { editor: Editor }) => {
	useObservable(editor.layout);
	
	return (
		<>
			<MenuBarView />
			<LayoutView layout={editor.layout} />
		</>
	);
};
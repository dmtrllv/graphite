import { useEffect, useState } from "react";
import { Editor } from "../editor";
import { EditorView } from "./editor";

export const App = () => {
	const [editor, setEditor] = useState<Editor | null>(null);

	useEffect(() => {
		Editor.load().then(setEditor);
	}, []);

	if(!editor)
		return <>Loading...</>;

	return <EditorView editor={editor} />;
};

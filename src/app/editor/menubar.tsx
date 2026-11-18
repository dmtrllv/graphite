import type { Editor } from "../../editor";

import "./styles/menubar.scss";

export const MenuBarView = ({ editor }: { editor: Editor }) => {
	

	return (
		<div className="menu-bar">
			<button onClick={() => editor.projectManager.saveProject()}>save</button>
			<button onClick={() => editor.windowManager.open("Test " + Math.floor(Math.random() * 1000), Test, {})}>save</button>
		</div>
	);
};

const Test = () => {
	return <div>Test</div>
}
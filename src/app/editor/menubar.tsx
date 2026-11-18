import type { Editor } from "../../editor";
import "./styles/menubar.scss";

export const MenuBarView = ({ editor }: { editor: Editor }) => {
	

	return (
		<div className="menu-bar">
			<button onClick={() => editor.projectManager.saveProject()}>save</button>
		</div>
	);
};
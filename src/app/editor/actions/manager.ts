import type { Editor } from "../editor";

export class ActionManager<T> {
	private readonly editor: Editor;

	public constructor(editor: Editor) {
		this.editor = editor;
	}

	public static register = (id: string, options: ActionOptions) => {
		
	}

	public undo() {

	}

	public redo() {
		
	}
}

type ActionOptions = {

};
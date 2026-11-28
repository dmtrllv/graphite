import type { ProjectInfo } from "./project";
import { ActionManager } from "./actions";
import { EditorLayout, WindowManager } from "./layout";
import { ProjectManager } from "./project-manager";
import { Storage } from "./storage";
import { Menubar } from "@editor/menubar";

export class Editor {
	public readonly storage = new Storage<EditorStorage>("editor");
	
	public readonly actions = new ActionManager(this);
	public readonly layout = new EditorLayout(null);
	public readonly windowManager = new WindowManager(this);
	public readonly projectManager = new ProjectManager(this);
	
	public readonly menubar: Menubar;

	public constructor(menubarInit: () => Menubar = () => new Menubar([])) {
		this.menubar = menubarInit();
	}
}

export type EditorStorage = {
	readonly savedProjects: ProjectInfo[];
};
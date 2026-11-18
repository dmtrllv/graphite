import { observable } from "../reactive";
import type { Editor } from "./editor";
import { Project, ProjectInfo } from "./project";

export class ProjectManager {
	@observable
	public accessor projects: ProjectInfo[] = [];

	@observable
	public accessor activeProject: Project;

	private readonly editor: Editor;

	public constructor(editor: Editor) {
		this.editor = editor;
		this.activeProject = this.createNewProject();
	}

	private createNewProject(name: string = "New Project") {
		return new Project(this, new ProjectInfo(name), this.editor.settings.defaultSettings);
	}

	public newProject() {
		this.activeProject = this.createNewProject();
	}

	public loadProject(name: string) {
		if (this.activeProject.info.name === name)
			return;
	}
}


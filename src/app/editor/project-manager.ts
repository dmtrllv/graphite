import { computed, observable } from "@reactive";
import type { Editor } from "./editor";
import type { Project, ProjectInfo } from "./project";

@observable
export class ProjectManager {
	public readonly editor: Editor;

	@observable
	private accessor _projects: Readonly<ProjectInfo>[];

	@computed
	public get projects(): Readonly<ProjectInfo>[] {
		return [...this._projects];
	}

	@observable
	private accessor _activeProject: Project | null = null;	

	@computed
	public get loadedProject() {
		return this._activeProject;
	}

	@computed
	public get isLoading() {
		return this._activeProject === null;
	}

	public constructor(editor: Editor) {
		this.editor = editor;
		this._projects = this.editor.storage.getOr("savedProjects", []);
	}

	public save() {
		
	}

	public saveAs(name: string) {
		
	}
	
	public load(name: string) {
		
	}

	public createNew() {
		
	}
}
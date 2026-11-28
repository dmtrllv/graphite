import { computed, observable } from "@reactive";
import { Project, type ProjectInfo } from "./project";
import { Graphite } from "@graphite";
import type { App } from "./app";

@observable
export class ProjectManager {
	public readonly app: App;

	@observable
	private accessor _projects: Readonly<ProjectInfo>[];

	@computed
	public get projects(): Readonly<ProjectInfo>[] {
		return [...this._projects];
	}

	private set projects(projects: Readonly<ProjectInfo>[]) {
		this._projects = projects;
		this.app.storage.set("savedProjects", this._projects);
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

	public constructor(app: App) {
		this.app = app;
		this._projects = this.app.storage.getOr("savedProjects", []);
	}

	public save() {

	}

	public saveAs(_name: string) {

	}

	public async load(name: string): Promise<Project | null> {
		const info = this.projects.find(p => p.name === name);
		if (!info)
			return null;
		const graphs = await Graphite.init(name);
		const project = new Project({ name, created: "", id: crypto.randomUUID(), saved: "" }, graphs);
		this.app.windowManager.closeAll();
		this._activeProject = project;
		return project;
	}

	public async create(name: string, load: boolean = true): Promise<boolean> {
		if (!this.projects.find(p => p.name === name)) {
			const info = {
				id: crypto.randomUUID(),
				saved: "",
				created: "",
				name
			};
			this.projects = [info, ...this._projects];
			if (load)
				return !!this.load(name);

			return true;
		}
		return false;
	}
}
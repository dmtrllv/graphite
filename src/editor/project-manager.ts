import { GraphEditorView } from "../app/graph";
import { VectorMathNode } from "../graph";
import { observable } from "../reactive";
import type { Editor } from "./editor";
import { Project, ProjectInfo } from "./project";
import { serializeProject, deserializeProject } from "./project-serializer";

const PROJECTS_KEY = "graphite:projects";

const projectKey = (name: string) => `graphite:project:${name}`;

const currentDateTime = () => new Intl.DateTimeFormat(undefined, {
	dateStyle: "short",
	timeStyle: "short",
	hour12: false
}).format(new Date()).replace(",", "");

export class ProjectManager {
	@observable
	public accessor projects: ProjectInfo[] = this.loadProjectInfos();

	@observable
	public accessor activeProject: Project;

	private readonly editor: Editor;

	public constructor(editor: Editor) {
		this.editor = editor;
		this.activeProject = this.createNewProject();
	}

	private loadProjectInfos(): ProjectInfo[] {
		const names = JSON.parse(localStorage.getItem(PROJECTS_KEY) ?? "[]") as ProjectInfo[];
		return names.map(({ name, lastSave }) => new ProjectInfo(name, lastSave));
	}

	private saveProjectInfos(): void {
		localStorage.setItem(PROJECTS_KEY, JSON.stringify(this.projects.map(({ name, lastSave }) => ({ name, lastSave }))));
	}

	private createNewProject(name: string = "New Project"): Project {
		const p = new Project(this, new ProjectInfo(name, currentDateTime()), this.editor.settings.defaultSettings.clone());
		const graph = p.graphManager.add("World");
		graph.addNode(VectorMathNode);
		const editor = p.graphManager.openEditor(graph);
		this.editor.windowManager.open(graph.name, GraphEditorView, { editor }, true);
		return p;
	}

	public saveProjectSettings(project: Project) {
		this.editor.settings.saveProjectSettings(project.info.name, project.settings);
	}

	public newProject(name?: string): void {
		this.activeProject.dispose();
		this.activeProject = this.createNewProject(name);
	}

	public saveProject(): void {
		const project = this.activeProject;
		const json = serializeProject(project);
		localStorage.setItem(projectKey(project.info.name), JSON.stringify(json));
		this.saveProjectSettings(project);
		project.info.lastSave = currentDateTime();

		if (!this.projects.some(info => info.name === project.info.name)) {
			this.projects = [...this.projects, project.info];
			this.saveProjectInfos();
		}
	}

	public loadProject(name: string): void {
		const json = localStorage.getItem(projectKey(name));
		const info = this.projects.find(p => p.name === name);

		if (!json || !info)
			throw new Error(`Project '${name}' does not exist.`);
		
		const settings = this.editor.settings.loadProjectSettings(name);
		const project = deserializeProject(this, JSON.parse(json), info.lastSave, settings);
		const oldProject = this.activeProject;

		this.editor.windowManager.closeAll();
		
		this.activeProject = project;
		const graph = this.activeProject.graphManager.get("World");

		if (graph) {
			const editor = this.activeProject.graphManager.openEditor(graph);
			this.editor.windowManager.open(graph.name, GraphEditorView, { editor }, true);
		}

		oldProject.dispose();
	}
}
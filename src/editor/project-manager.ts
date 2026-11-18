import { GraphEditorView } from "../app/graph";
import { VectorMathNode } from "../graph";
import { observable } from "../reactive";
import type { Editor } from "./editor";
import { Project, ProjectInfo } from "./project";
import { serializeProject, deserializeProject, type SerializedProject } from "./project-serializer";

const PROJECTS_KEY = "graphite:projects";

const projectKey = (name: string) => `graphite:project:${name}`;

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
		const names = JSON.parse(localStorage.getItem(PROJECTS_KEY) ?? "[]") as string[];
		return names.map(name => new ProjectInfo(name));
	}

	private saveProjectInfos(): void {
		localStorage.setItem(PROJECTS_KEY, JSON.stringify(this.projects.map(project => project.name)));
	}

	private createNewProject(name: string = "New Project"): Project {
		const p = new Project(this, new ProjectInfo(name), this.editor.settings.defaultSettings.clone());
		const graph = p.graphManager.add("World");
		graph.addNode(VectorMathNode);
		const editor = p.graphManager.openEditor(graph);
		this.editor.windowManager.open(graph.name, GraphEditorView, { editor });
		return p;
	}

	public newProject(name?: string): void {
		this.activeProject = this.createNewProject(name);
	}

	public saveProject(): void {
		const project = this.activeProject;
		const json = serializeProject(project);
		console.log(JSON.stringify(json));
		localStorage.setItem(projectKey(project.info.name), JSON.stringify(json));

		if (!this.projects.some(info => info.name === project.info.name)) {
			this.projects = [...this.projects, project.info];
			this.saveProjectInfos();
		}
	}

	public loadProject(name: string): void {
		const json = localStorage.getItem(projectKey(name));

		if (!json)
			throw new Error(`Project '${name}' does not exist.`);

		const project = deserializeProject(this, JSON.parse(json) as SerializedProject);
		this.activeProject = project;
	}
}
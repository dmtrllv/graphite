import { SubgraphNode, Vec2, type GraphEditor } from "./graph";
import { observable } from "../reactive";
import type { Editor } from "./editor";
import { Project, ProjectInfo } from "./project";
import { serializeProject, deserializeProject } from "./project-serializer";
import type { WindowOptions } from "./window";
import type { ActionHistory } from "./actions";

const PROJECTS_KEY = "graphite:projects";
const projectKey = (name: string) => `graphite:project:${name}`;

const currentDateTime = () => new Intl.DateTimeFormat(undefined, {
	dateStyle: "short",
	timeStyle: "short",
	hour12: false
}).format(new Date()).replace(",", "");

const createProjectInfo = (name: string, lastSave: string): ProjectInfo => {
	const info = new ProjectInfo();
	info.name = name;
	info.lastSave = lastSave;
	return info;
};

@observable
export class ProjectManager {
	@observable
	public accessor projects: ProjectInfo[] = this.loadProjectInfos();

	@observable
	public accessor activeProject: Project;

	private readonly editor: Editor;

	public get history(): ActionHistory {
		return this.editor.history;
	}

	public constructor(editor: Editor) {
		this.editor = editor;
		this.activeProject = this.createNewProject();
	}

	private loadProjectInfos(): ProjectInfo[] {
		const names = JSON.parse(localStorage.getItem(PROJECTS_KEY) ?? "[]") as ProjectInfo[];
		return names.map(({ name, lastSave }) => createProjectInfo(name, lastSave));
	}

	private saveProjectInfos(): void {
		localStorage.setItem(PROJECTS_KEY, JSON.stringify(this.projects.map(({ name, lastSave }) => ({ name, lastSave }))));
	}

	private createNewProject(name = "New Project"): Project {
		const info = createProjectInfo(name, currentDateTime());
		const project = new Project(this, info, this.editor.settings.defaultSettings.clone());
		const graph = project.graphManager.worldGraph;
		this.openGraph(project.graphManager.openEditor(graph));
		this.history.clear();
		return project;
	}

	public saveProjectSettings(project: Project): void {
		this.editor.settings.saveProjectSettings(project.info.name, project.settings);
	}

	public newProject(name?: string): void {
		this.history.clear();
		this.activeProject.dispose();
		this.editor.windowManager.closeAll();
		this.activeProject = this.createNewProject(name);
	}

	public saveProjectAs(name: string): boolean {
		if (this.projects.find(info => info.name === name))
			return false;

		this.activeProject.setInfo(createProjectInfo(name, currentDateTime()));
		this.projects = [this.activeProject.info, ...this.projects];
		this.saveProjectInfos();
		this.saveProject();
		return true;
	}

	public saveProject(): void {
		const project = this.activeProject;

		if (!project.isSaved) {
			this.editor.windowManager.open("Save Project As", "save-project", { manager: this }, { singleInstance: true, float: true });
			return;
		}

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
		if (this.activeProject.info.name === name)
			return;

		const json = localStorage.getItem(projectKey(name));
		const info = this.projects.find(project => project.name === name);

		if (!json || !info)
			throw new Error(`Project '${name}' does not exist.`);

		const settings = this.editor.settings.loadProjectSettings(name);
		const project = deserializeProject(this, JSON.parse(json), info.lastSave, settings);
		const oldProject = this.activeProject;
		
		this.editor.windowManager.closeAll();
		this.activeProject = project;

		const graph = project.graphManager.worldGraph;
		this.openGraph(project.graphManager.openEditor(graph));

		this.history.clear();

		oldProject.dispose();
	}

	public openGraph(editor: GraphEditor): void {
		const graph = editor.graph;
		const options: WindowOptions = {
			singleInstance: false,
			check: window => window.component === "graph-editor" && window.props["editor"] === editor,
			onClose: () => graph.manager?.closeEditor(graph, editor)
		};

		this.editor.windowManager.open(graph.name, "graph-editor", {
			editor,
			onCreateSubgraph: (parentEditor: GraphEditor, position: Vec2) => this.createSubgraph(parentEditor, position),
			projectManager: this
		}, options);
	}

	public createSubgraph(editor: GraphEditor, position: Vec2): void {
		const manager = this.activeProject.graphManager;
		const graph = manager.createSubgraph();
		const node = editor.addNode(SubgraphNode, position) as SubgraphNode;

		node.graphId = graph.id;
		this.openGraph(manager.openEditor(graph));
	}

	public createPassGraph(): void {
		const manager = this.activeProject.graphManager;
		const graph = manager.createPassGraph();
		this.openGraph(manager.openEditor(graph));
	}

	public createSimulationGraph(): void {
		const manager = this.activeProject.graphManager;
		const graph = manager.createSimulationGraph();
		this.openGraph(manager.openEditor(graph));
	}
}

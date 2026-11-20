import { SaveProjectView } from "../app/editor/windows/projects";
import { GraphEditorView } from "../app/editor/graph";
import { VectorMathNode, SubgraphNode, Vec2, type GraphEditor } from "./graph";
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
		return names.map(({ name, lastSave }) => ProjectInfo.deserialize({ name, lastSave }));
	}

	private saveProjectInfos(): void {
		localStorage.setItem(PROJECTS_KEY, JSON.stringify(this.projects.map(({ name, lastSave }) => ({ name, lastSave }))));
	}

	private createNewProject(name: string = "New Project"): Project {
		const info = ProjectInfo.deserialize({ name, lastSave: currentDateTime() });
		const p = new Project(this, info, this.editor.settings.defaultSettings.clone());
		const graph = p.graphManager.worldGraph;
		graph.addNode(VectorMathNode);
		this.openGraph(p.graphManager.openEditor(graph));
		return p;
	}

	public saveProjectSettings(project: Project) {
		this.editor.settings.saveProjectSettings(project.info.name, project.settings);
	}

	public newProject(name?: string): void {
		this.activeProject.dispose();
		this.activeProject = this.createNewProject(name);
	}

	public saveProjectAs(name: string): boolean {
		if (this.projects.find(info => info.name === name))
			return false;

		this.activeProject.setInfo(ProjectInfo.deserialize({ name, lastSave: currentDateTime() }));
		this.projects = [this.activeProject.info, ...this.projects];
		this.saveProjectInfos();
		this.saveProject();
		return true;
	}

	public saveProject(): void {
		const project = this.activeProject;
		if (!project.isSaved) {
			this.editor.windowManager.open("Save Project As", SaveProjectView, { manager: this }, { singleInstance: true, float: true });
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
			this.openGraph(this.activeProject.graphManager.openEditor(graph));
		}

		oldProject.dispose();
	}

	public openGraph(editor: GraphEditor): void {
		const graph = editor.graph;

		this.editor.windowManager.open(graph.name, GraphEditorView, {
			editor,
			onCreateSubgraph: (parentEditor, position) => this.createSubgraph(parentEditor, position),
			projectManager: this
		}, { singleInstance: false, check: (w) => w.Component === GraphEditorView && w.props["editor"] === editor });
	}

	public createSubgraph(editor: GraphEditor, position: Vec2): void {
		const manager = this.activeProject.graphManager;
		const graph = manager.createSubgraph();
		const node = editor.addNode(SubgraphNode, position) as SubgraphNode;
		node.graphId = graph.id;
		this.openGraph(manager.openEditor(graph));
	}
}
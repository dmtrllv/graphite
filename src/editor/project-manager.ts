import { CreateSubgraphAction, Graph, SubgraphNode, Vec2, type GraphEditor } from "./graph";
import { observable } from "../reactive";
import type { Editor } from "./editor";
import { Project, ProjectInfo } from "./project";
import { serializeProject, deserializeProject } from "./project-serializer";
import type { WindowOptions } from "./window";
import type { ActionManager } from "./actions";

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
	public accessor activeProject!: Project;

	private readonly editor: Editor;

	public get actionManager(): ActionManager {
		return this.editor.actionManager;
	}

	public constructor(editor: Editor) {
		this.editor = editor;
		if (editor.settings.appSettings.openLastProjectOnStartup && this.projects[0])
			this.loadProject(this.projects[0].name);
		else
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
		this.actionManager.history.clear();
		return project;
	}

	public saveProjectSettings(project: Project): void {
		this.editor.settings.saveProjectSettings(project.info.name, project.settings);
	}

	public newProject(name?: string): void {
		this.actionManager.history.clear();
		this.editor.windowManager.closeAll();
		this.activeProject.dispose();
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

		project.info.lastSave = currentDateTime();

		const json = serializeProject(project);

		localStorage.setItem(projectKey(project.info.name), JSON.stringify(json));
		this.saveProjectSettings(project);
		this.saveProjectInfos();
	}

	public loadProject(name: string): void {
		const oldProject = this.activeProject as Project | undefined;

		if (oldProject && (oldProject.info.name === name))
			return;

		const json = localStorage.getItem(projectKey(name));
		const info = this.projects.find(project => project.name === name);

		if (!json || !info)
			throw new Error(`Project '${name}' does not exist.`);

		const settings = this.editor.settings.loadProjectSettings(name);
		const project = deserializeProject(this, JSON.parse(json), info.lastSave, settings);

		this.editor.windowManager.closeAll();
		this.activeProject = project;

		const projects = [...this.projects];
		projects.splice(projects.indexOf(info), 1);
		this.projects = [info, ...projects];
		this.saveProjectInfos();

		const graph = project.graphManager.worldGraph;
		this.openGraph(project.graphManager.openEditor(graph));

		this.actionManager.history.clear();

		oldProject?.dispose();
	}

	public closeGraphEditor(editor: GraphEditor): void {
		const window = this.editor.windowManager.windows.find(window => window.component === "graph-editor" && window.props["editor"] === editor);

		if (window)
			window.close();
		else
			editor.graph.manager?.closeEditor(editor.graph, editor);
	}

	public checkRemovableGraph(graph: Graph): void {
		if (this.activeProject.graphManager !== graph.manager)
			return;

		const simulations = [...this.activeProject.simulationManager.simulations.values()].filter(simulation => simulation.graphId === graph.id);

		if (simulations.length)
			throw new Error(`Cannot remove graph "${graph.name}" because it is referenced by simulations: ${simulations.map(simulation => simulation.name).join(", ")}!`);

		const references = [...graph.manager!.graphs.values()].flatMap(candidate =>
			[...candidate.nodes.values()].filter(node => node instanceof SubgraphNode && node.graphId === graph.id)
		);

		if (references.length)
			throw new Error(`Cannot remove graph "${graph.name}" because it is referenced by ${references.length} SubgraphNode(s)!`);
	}


	public openGraph(editor: GraphEditor): void {
		const graph = editor.graph;
		const options: WindowOptions = {
			singleInstance: false,
			check: window => window.component === "graph-editor" && window.props["editor"] === editor,
			placementKey: editor,
			onClose: () => graph.manager?.closeEditor(graph, editor),
		};

		const window = this.editor.windowManager.open(graph.name, "graph-editor", {
			editor,
			onCreateSubgraph: (parentEditor: GraphEditor, position: Vec2) => this.createSubgraph(parentEditor, position),
			projectManager: this
		}, options);

		this.editor.windowManager.activateWindow(window);
	}

	public activateGraphEditor(editor: GraphEditor): void {
		if (editor.graph.manager !== this.activeProject.graphManager)
			return;

		this.openGraph(editor);
	}

	public createSubgraph(editor: GraphEditor, position: Vec2): void {
		this.actionManager.execute(new CreateSubgraphAction(editor, this, position));
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

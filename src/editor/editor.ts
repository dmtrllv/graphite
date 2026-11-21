import { observable } from "../reactive";
import { EditorLayout } from "./editor-layout";
import { Menubar, MenuItem, MenuSeparator } from "./menubar";
import { ProjectManager } from "./project-manager";
import { SettingsManager } from "./settings-manager";
import { WindowManager } from "./window";
import { ActionHistory } from "./actions";

@observable
export class Editor {
	private static _instance: Editor | null;

	public static readonly load = async () => {
		if (this._instance)
			return this._instance;

		this._instance = new Editor();
		await this._instance.init();
		return this._instance;
	};

	@observable
	public accessor settings: SettingsManager = new SettingsManager();

	public readonly history = new ActionHistory();

	public readonly layout: EditorLayout = new EditorLayout(null);
	public readonly windowManager: WindowManager = new WindowManager(this.layout, this.history);
	public readonly projectManager: ProjectManager = new ProjectManager(this);


	public readonly menubar: Menubar = new Menubar([
		new MenuItem("file", "File", undefined, [
			new MenuItem("new_project", "New Project", () => this.projectManager.newProject()),
			MenuSeparator,
			new MenuItem("save", "Save", () => this.projectManager.saveProject()),
			new MenuItem("save_as", "Save As", () => this.windowManager.open("Save Project As", "save-project", { manager: this.projectManager }, { singleInstance: true, float: true })),
			MenuSeparator,
			new MenuItem("open", "Open", () => this.windowManager.open("Projects", "projects", { manager: this.projectManager }, { singleInstance: true, float: true })),
			new MenuItem("open_recent", "Open Recent", undefined, this.projectManager.projects.map(project => {
				return new MenuItem(project.name, project.name, () => this.projectManager.loadProject(project.name));
			})),
			MenuSeparator,
			new MenuItem("settings", "Settings", () => {
				this.windowManager.open("Settings", "settings", { projectManager: this.projectManager }, { singleInstance: true, float: true });
			})
		]),
		new MenuItem("edit", "Edit", undefined, [
			new MenuItem("undo", "Settings", () => {
				
			}),
			new MenuItem("redo", "Settings", () => {
				
			})
		]),
		new MenuItem("view", "View", undefined, [
			new MenuItem("world_graph", "World Graph", () => {
				const manager = this.projectManager.activeProject.graphManager;
				this.projectManager.openGraph(manager.openEditor(manager.worldGraph));
			}),
			new MenuItem("new_pass_graph", "New Pass Graph", () => this.projectManager.createPassGraph()),
			new MenuItem("new_simulation_graph", "New Simulation Graph", () => this.projectManager.createSimulationGraph())
		])
	]);

	public async init(): Promise<void> { }
}

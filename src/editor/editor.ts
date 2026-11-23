import { observable } from "../reactive";
import { EditorLayout } from "./editor-layout";
import { Menubar, MenuItem, MenuSeparator } from "./menubar";
import { ProjectManager } from "./project-manager";
import { SettingsManager } from "./settings/settings-manager";
import { WindowManager } from "./window";
import { ActionManager } from "./actions";
import { GraphEditor, DeleteNodesAction } from "./graph";

@observable
export class Editor {

	private static _instance: Editor | null = null;
	private static _loading: Promise<Editor> | null = null;

	public static readonly load = async (): Promise<Editor> => {
		if (this._instance)
			return this._instance;

		if (this._loading)
			return this._loading;

		const instance = new Editor();

		this._loading = new Promise(async (res, rej) => {
			try {
				await instance.init();
				this._instance = instance;
				res(instance);
			} catch (error) {
				this._instance = null;
				rej(error);
			} finally {
				this._loading = null;
			}
		})

		return this._loading;
	};


	@observable
	public accessor settings: SettingsManager = new SettingsManager();

	public readonly actionManager = new ActionManager();

	public readonly layout: EditorLayout = new EditorLayout(null);
	public readonly windowManager: WindowManager = new WindowManager(this.layout, this.actionManager);
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
			new MenuItem("undo", "Undo", () => this.actionManager.executeById("history.undo")),
			new MenuItem("redo", "Redo", () => this.actionManager.executeById("history.redo")),
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

	public constructor() {
		this.actionManager.register(DeleteNodesAction, GraphEditor, editor => {
			return editor.selectedNodes.length ? new DeleteNodesAction(editor, this.projectManager, editor.selectedNodes) : null;
		});
	}

	public async init(): Promise<void> { }

	public dispose(): void {
		this.windowManager.closeAll();
		this.projectManager.activeProject?.dispose();
	}
}

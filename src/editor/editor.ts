import { ProjectList } from "../app/editor/windows/projects";
import { SettingsView } from "../app/editor/windows/settings";
import { EditorLayout } from "./editor-layout";
import { Menubar, MenuItem, MenuSeparator } from "./menubar";
import { ProjectManager } from "./project-manager";
import { SettingsManager } from "./settings-manager";
import { WindowManager } from "./window-manager";

export class Editor {
	private static _instance: Editor | null;

	public static readonly load = async () => {
		if (this._instance)
			return this._instance;

		this._instance = new Editor();
		await this._instance.init();
		return this._instance;
	}

	public readonly settings: SettingsManager = new SettingsManager();
	public readonly layout: EditorLayout = new EditorLayout(null);
	public readonly windowManager: WindowManager = new WindowManager(this.layout);
	public readonly projectManager: ProjectManager = new ProjectManager(this);

	public readonly menubar: Menubar = new Menubar([
		new MenuItem("file", "File", undefined, [
			new MenuItem("new_project", "New Project"),
			MenuSeparator,
			new MenuItem("save", "Save", () => this.projectManager.saveProject()),
			new MenuItem("save_as", "Save As"),
			MenuSeparator,
			new MenuItem("open", "Open", () => this.windowManager.open("Projects", ProjectList, { manager: this.projectManager }, { singleInstance: true, float: true })),
			new MenuItem("open_recent", "Open Recent", undefined, this.projectManager.projects.map(p => {
				return new MenuItem(p.name, p.name, () => {
					this.projectManager.loadProject(p.name);
				});
			})),
			MenuSeparator,
			new MenuItem("settings", "Settings", () => {
				this.windowManager.open("Settings", SettingsView, { projectManager: this.projectManager }, { singleInstance: true, float: true });
			})
		]),
		new MenuItem("edit", "Edit", undefined, [

		]),
		new MenuItem("view", "View", undefined, [
			new MenuItem("world_graph", "World Graph", () =>{
				const manager = this.projectManager.activeProject.graphManager;
				const graph = manager.worldGraph;
				const editor = manager.openEditor(graph);
				this.projectManager.openGraph(editor);
			}),
		]),
	]);

	public async init() { }
}
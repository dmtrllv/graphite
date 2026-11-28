import { assert } from "@utils";
import { createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import { AppView } from "./ui";
import { Editor, Menubar, MenuItem, MenuSeparator } from "./editor";
import { ProjectManagerWindow } from "./ui/editor/windows";

const AppContext = createContext<App | null>(null);

export const useApp = () => assert.notNull(useContext(AppContext));

export class App {
	public static readonly render = (root: HTMLElement) => {
		const app = new App();
		createRoot(root).render(app.render());
		return app;
	};

	public readonly editor: Editor;

	private constructor() {
		this.editor = new Editor(() => this.createMenubar());
		
		this.editor.windowManager.open(ProjectManagerWindow);
	}

	private createMenubar() {
		return new Menubar([
			new MenuItem("file", "File", undefined, [
				new MenuItem("new_project", "New Project", () => this.editor.projectManager.createNew()),
				MenuSeparator,
				new MenuItem("save", "Save", () => this.editor.projectManager.save()),
				new MenuItem("save_as", "Save As", () => {
					//this.windowManager.open("Save Project As", "save-project", { manager: this.projectManager }, { singleInstance: true, float: true }))
				}),
				MenuSeparator,
				new MenuItem("open", "Open", () => {
					this.editor.windowManager.open(ProjectManagerWindow)
					//this.windowManager.open("Projects", "projects", { manager: this.projectManager }, { singleInstance: true, float: true })
				}),
				new MenuItem("open_recent", "Open Recent", undefined, () => this.editor.projectManager.projects.map(project => {
					return new MenuItem(project.name, project.name, () => this.editor.projectManager.load(project.name));
				})),
				MenuSeparator,
				new MenuItem("settings", "Settings", () => {
					//this.windowManager.open("Settings", "settings", { projectManager: this.projectManager }, { singleInstance: true, float: true });
				})
			]),
			new MenuItem("edit", "Edit", undefined, [
				new MenuItem("undo", "Undo", () => this.editor.actions.undo()),
				new MenuItem("redo", "Redo", () => this.editor.actions.redo()),
			]),
			new MenuItem("view", "View", undefined, [
				new MenuItem("world_graph", "World Graph", () => {
					const project = this.editor.projectManager.loadedProject;
					if (project) {
						//this.windowManager.open("World", "graph-editor", { graph: project.graphs.world }, { singleInstance: true });
					}
					//this.projectManager.openGraph(manager.openEditor(manager.worldGraph));
				}),
				//new MenuItem("new_pass_graph", "New Pass Graph", () => this.projectManager.createPassGraph()),
				//new MenuItem("new_simulation_graph", "New Simulation Graph", () => this.projectManager.createSimulationGraph())
			])
		])
	}

	private readonly render = () => {
		return (
			<AppContext value={this}>
				<AppView />
			</AppContext>
		);
	}
}
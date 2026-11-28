import { Menubar, MenuItem, MenuSeparator } from "./menubar";
import { GraphEditorWindow } from "../editor/graph/editor-view";
import { ProjectManagerWindow } from "../windows";
import { RecentProjectMenuItem } from "./recent-projects";
import type { App } from "../app";

export const createAppMenubar = ({ projectManager, windowManager, actions }: App) => new Menubar([
	new MenuItem("File", [
		new MenuItem("New Project", () => { }),
		MenuSeparator,
		new MenuItem("Save", () => projectManager.save()),
		new MenuItem("Save As", () => {
			//this.windowManager.open("Save Project As", "save-project", { manager: this.projectManager }, { singleInstance: true, float: true }))
		}),
		MenuSeparator,
		new MenuItem("Open", () => {
			windowManager.open(ProjectManagerWindow)
			//this.windowManager.open("Projects", "projects", { manager: this.projectManager }, { singleInstance: true, float: true })
		}),
		new RecentProjectMenuItem(projectManager),
		MenuSeparator,
		new MenuItem("Settings", () => {
			//this.windowManager.open("Settings", "settings", { projectManager: this.projectManager }, { singleInstance: true, float: true });
		})
	]),
	new MenuItem("Edit", [
		new MenuItem("Undo", () => actions.undo()),
		new MenuItem("Redo", () => actions.redo()),
	]),
	new MenuItem("View", [
		new MenuItem("World Graph", () => {
			const project = projectManager.loadedProject;
			if (project)
				windowManager.open(GraphEditorWindow, { title: "World", graph: project.graphs.world });
			//this.projectManager.openGraph(manager.openEditor(manager.worldGraph));
		}),
		//new MenuItem("new_pass_graph", "New Pass Graph", () => this.projectManager.createPassGraph()),
		//new MenuItem("new_simulation_graph", "New Simulation Graph", () => this.projectManager.createSimulationGraph())
	])
])
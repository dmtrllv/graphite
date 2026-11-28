import { assert } from "@utils";
import { createContext, useContext } from "react";
import { createRoot } from "react-dom/client";
import { ProjectManagerWindow } from "./windows";
import { createAppMenubar } from "./menubar/app";
import { MenuBarView } from "./menubar/menubar-view";
import { Workspace } from "./layout/workspace";
import { Layout, WindowManager } from "./layout";
import type { Menubar } from "./menubar/menubar";
import type { ProjectInfo } from "./project";
import { ActionManager } from "./actions";
import { ProjectManager } from "./project-manager";
import { Storage } from "./storage";

import "./app.scss";

const AppContext = createContext<App | null>(null);

export const useApp = () => assert.notNull(useContext(AppContext));

export class App {
	public static readonly render = (root: HTMLElement) => {
		const app = new App();
		createRoot(root).render(app.render());
		return app;
	};

	public readonly menubar: Menubar;
	public readonly layout = new Layout(null);
	public readonly windowManager = new WindowManager(this);

	public readonly storage = new Storage<AppStorage>("graphite");
	
	public readonly actions = new ActionManager(this);
	public readonly projectManager = new ProjectManager(this);

	private constructor() {
		this.menubar = createAppMenubar(this);

		this.windowManager.open(ProjectManagerWindow);
	}

	private readonly render = () => {
		return (
			<AppContext value={this}>
				<div className="app">
					<MenuBarView menubar={this.menubar} />
					<div className="editor">
						<Workspace app={this} />
					</div>
				</div>
			</AppContext>
		);
	}
}

export type AppStorage = {
	readonly savedProjects: ProjectInfo[];
};
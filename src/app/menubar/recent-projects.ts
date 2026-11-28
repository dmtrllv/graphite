import type { ProjectManager } from "../project-manager";
import { MenuItem, type MenuItemChild } from "./menubar";
import { computed, observable } from "@reactive";

@observable
export class RecentProjectMenuItem extends MenuItem {
	private readonly projectManager: ProjectManager;

	@computed
	public override get children(): MenuItemChild[] {
		return this.projectManager.projects.map(project => {
			return new MenuItem(project.name, () => this.projectManager.load(project.name).then(ok => {
				if(ok) {
					console.log("open...")
				}
			}));
		});
	}

	public constructor(projectManager: ProjectManager) {
		super("Open Recent", []);
		this.projectManager = projectManager;
	}
}
import { GraphManager } from "../graph";
import { observable } from "../reactive";
import type { ProjectManager } from "./project-manager";
import { Settings } from "./settings";

export class Project {
	public readonly manager: ProjectManager;
	public readonly info: ProjectInfo;
	public readonly settings: Settings;

	public readonly graphManager: GraphManager;

	public get isSaved() {
		return !!this.manager.projects.find(info => info.name === this.info.name);
	}

	public constructor(manager: ProjectManager, info: ProjectInfo, settings: Settings, graphManager: GraphManager = new GraphManager()) {
		this.manager = manager;
		this.info = info;
		this.settings = settings;
		this.graphManager = graphManager;
	}
}

export class ProjectInfo {
	@observable
	public accessor name: string;

	public constructor(name: string) {
		this.name = name;
	}
}
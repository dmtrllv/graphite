import { GraphManager } from "./graph";
import { observable, subscribe, type Unsubscriber } from "../reactive";
import type { ProjectManager } from "./project-manager";
import { Settings } from "./settings";
import { SimulationManager } from "./simulation";

export class Project {
	public readonly manager: ProjectManager;

	@observable
	public accessor info: ProjectInfo;

	public readonly settings: Settings;

	public readonly graphManager: GraphManager;
	public readonly simulationManager: SimulationManager;
	private readonly unsubscribeSettings: Unsubscriber;

	public get isSaved() {
		return !!this.manager.projects.find(info => info.name === this.info.name);
	}

	public constructor(manager: ProjectManager, info: ProjectInfo, settings: Settings, graphManager: GraphManager = new GraphManager(), simulationManager: SimulationManager = new SimulationManager(graphManager)) {
		this.manager = manager;
		this.info = info;
		this.settings = settings;
		this.graphManager = graphManager;
		this.simulationManager = simulationManager;

		this.unsubscribeSettings = subscribe(this.settings.preferences, { recursive: true }, this.onSettingsChange);
		this.unsubscribeSettings = subscribe(this.info, this.onSettingsChange);
	}

	private readonly onSettingsChange = () => {
		if (this.isSaved)
			this.manager.saveProjectSettings(this);
	}

	public dispose() {
		this.unsubscribeSettings();
	}
}

export class ProjectInfo {
	@observable
	public accessor name: string;

	@observable
	public accessor lastSave: string;

	public constructor(name: string, lastSave: string) {
		this.name = name;
		this.lastSave = lastSave;
	}
}
import { GraphManager } from "./graph";
import { observable, subscribe, type Unsubscriber } from "../reactive";
import type { ProjectManager } from "./project-manager";
import { Settings } from "./settings";
import { SimulationManager } from "./simulation";
import { serializable, Serializable, type SerializableData } from "./serializable";

export interface ProjectInfoData {
	name: string;
	lastSave: string;
}

@serializable
export class ProjectInfo extends Serializable<ProjectInfoData> {
	@observable
	@serializable(String)
	public accessor name!: string;

	@observable
	@serializable(String)
	public accessor lastSave!: string;
}

@serializable
export class Project extends Serializable {
	public readonly manager: ProjectManager;

	@observable
	@serializable(ProjectInfo)
	public accessor info: ProjectInfo;

	@serializable(Settings)
	public readonly settings: Settings;

	public readonly graphManager: GraphManager;
	public readonly simulationManager: SimulationManager;
	private readonly unsubscribeSettings: Unsubscriber[];

	public get isSaved() {
		return !!this.manager.projects.find(info => info.name === this.info.name);
	}

	public constructor(data: SerializableData, manager: ProjectManager, info: ProjectInfo, settings: Settings, graphManager: GraphManager = new GraphManager(), simulationManager: SimulationManager = new SimulationManager(graphManager)) {
		super(data);
		this.manager = manager;
		this.info = info;
		this.settings = settings;
		this.graphManager = graphManager;
		this.simulationManager = simulationManager;

		this.unsubscribeSettings = [
			subscribe(this.settings.preferences, { recursive: true }, this.onSettingsChange),
			subscribe(this.info, this.onSettingsChange)
		];
	}

	private readonly onSettingsChange = () => {
		if (this.isSaved)
			this.manager.saveProjectSettings(this);
	}

	public dispose() {
		this.unsubscribeSettings.forEach(unsubscribe => unsubscribe());
	}
}

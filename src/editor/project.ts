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

type ProjectArgs = [
	manager: ProjectManager,
	info: ProjectInfo,
	settings: Settings,
	graphManager?: GraphManager,
	simulationManager?: SimulationManager
];

@serializable
export class Project extends Serializable<SerializableData, ProjectArgs> {
	public readonly manager: ProjectManager;

	@observable
	@serializable(ProjectInfo)
	public accessor info: ProjectInfo;

	@serializable(Settings)
	public readonly settings: Settings;

	public readonly graphManager: GraphManager;
	public readonly simulationManager: SimulationManager;
	private unsubscribeSettings: Unsubscriber[] = [];

	public get isSaved() {
		return !!this.manager.projects.find(info => info.name === this.info.name);
	}

	public constructor(data: SerializableData, manager: ProjectManager, info: ProjectInfo, settings: Settings, graphManager: GraphManager = new GraphManager(), simulationManager: SimulationManager = new SimulationManager(graphManager)) {
		super(data, manager, info, settings, graphManager, simulationManager);
		this.manager = manager;
		this.info = info;
		this.settings = settings;
		this.graphManager = graphManager;
		this.simulationManager = simulationManager;

		this.bindSubscriptions();
	}

	public setInfo(info: ProjectInfo) {
		this.info = info;
		this.bindSubscriptions();
	}

	private bindSubscriptions() {
		this.unsubscribeSettings.forEach(unsubscribe => unsubscribe());
		this.unsubscribeSettings = [
			subscribe(this.settings.preferences, { recursive: true }, this.onSettingsChange),
			subscribe(this.info, this.onSettingsChange)
		];
	}

	protected override afterDeserialize() {
		this.bindSubscriptions();
	}

	private readonly onSettingsChange = () => {
		if (this.isSaved)
			this.manager.saveProjectSettings(this);
	}

	public dispose() {
		this.unsubscribeSettings.forEach(unsubscribe => unsubscribe());
	}
}

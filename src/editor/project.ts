import { GraphManager } from "./graph";
import { observable, subscribe, type Unsubscribe } from "../reactive";
import type { ProjectManager } from "./project-manager";
import { Settings } from "./settings";
import { SimulationManager } from "./simulation";
import { Serializable, serializable } from "./serializable";

@observable
@serializable({ type: "project:info", create: () => new ProjectInfo() })
export class ProjectInfo extends Serializable {
	@observable
	@serializable(String)
	public accessor name!: string;

	@observable
	@serializable(String)
	public accessor lastSave!: string;
}

@observable
@serializable({
	type: "project",
	create: (_, context) => new Project(context["manager"], context["info"], context["settings"], new GraphManager(false))
})
export class Project extends Serializable {
	public readonly manager: ProjectManager;

	@observable
	public accessor info: ProjectInfo;

	public readonly settings: Settings;

	@serializable(GraphManager)
	public readonly graphManager: GraphManager;

	@serializable(SimulationManager)
	public readonly simulationManager: SimulationManager;

	private unsubscribeSettings: Unsubscribe[] = [];

	public get isSaved() {
		return !!this.manager.projects.find(info => info.name === this.info.name);
	}

	public constructor(manager: ProjectManager, info: ProjectInfo, settings: Settings, graphManager: GraphManager = new GraphManager(), simulationManager: SimulationManager = new SimulationManager(graphManager)) {
		super();
		this.manager = manager;
		this.info = info;
		this.settings = settings;
		this.graphManager = graphManager;
		this.graphManager.setHistory(manager.history);
		this.graphManager.setProjectManager(manager);
		this.simulationManager = simulationManager;
		this.bindSubscriptions();
	}

	protected override initialize() {
		this.graphManager.setHistory(this.manager.history);
		this.graphManager.setProjectManager(this.manager);
		this.simulationManager.setGraphManager(this.graphManager);
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

	private readonly onSettingsChange = () => {
		if (this.isSaved)
			this.manager.saveProjectSettings(this);
	}

	public dispose() {
		this.unsubscribeSettings.forEach(unsubscribe => unsubscribe());
		this.graphManager.disposeEditors();
	}
}
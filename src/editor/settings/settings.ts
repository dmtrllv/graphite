import { computed, observable } from "@reactive";
import { Serializable, serializable } from "../serializable";
import type { SettingsManager } from "./settings-manager";

@observable
@serializable({ type: "settings:preferences", create: () => new Preferences() })
export class Preferences extends Serializable {
	@observable
	@serializable(Boolean)
	public accessor autoHideMenu!: boolean;

	@observable
	@serializable(String)
	private accessor _accentColor!: string;

	@computed
	public get accentColor() {
		return this._accentColor;
	}

	public set accentColor(value: string) {
		this._accentColor = value;
		document.documentElement.style.setProperty("--accent-1", value);
	}

	public constructor() {
		super();
		this.autoHideMenu = false;
		this._accentColor = "#00b7ff";
	}

	protected override initialize() {
		document.documentElement.style.setProperty("--accent-1", this.accentColor);
	}
}

@observable
@serializable({ type: "settings:graph", create: () => new GraphSettings() })
export class GraphSettings extends Serializable {
	@observable
	@serializable(Number)
	public accessor lineWidth!: number;

	@observable
	@serializable(Number)
	public accessor curve!: number;

	@observable
	@serializable(String)
	private accessor _scalarColor!: string;

	@computed
	public get scalarColor() {
		return this._scalarColor;
	}

	public set scalarColor(value: string) {
		this._scalarColor = value;
		document.documentElement.style.setProperty("--graph-scalar-color", value);
	}

	@observable
	@serializable(String)
	private accessor _vectorColor!: string;

	@computed
	public get vectorColor() {
		return this._vectorColor;
	}

	public set vectorColor(value: string) {
		this._vectorColor = value;
		document.documentElement.style.setProperty("--graph-vector-color", value);
	}
	
	public constructor() {
		super();
		this.lineWidth = 1.5;
		this.curve = 1;
		this._scalarColor = "#E5A45B";
		this._vectorColor = "#56B6C2";
	}

	
	protected override initialize() {
		document.documentElement.style.setProperty("--graph-scalar-color", this._scalarColor);
		document.documentElement.style.setProperty("--graph-vector-color", this._vectorColor);
	}
}

@observable
@serializable({ type: "settings", create: (_, ctx) =>new Settings(ctx["manager"]) })
export class Settings extends Serializable {
	@serializable(Preferences)
	public readonly preferences!: Preferences;

	@serializable(GraphSettings)
	public readonly graph!: GraphSettings;
	
	private readonly manager: SettingsManager;

	public get app() {
		return this.manager.appSettings;
	}

	public constructor(manager: SettingsManager) {
		super();
		this.manager = manager;
		this.preferences = new Preferences();
		this.graph = new GraphSettings();
	}
}

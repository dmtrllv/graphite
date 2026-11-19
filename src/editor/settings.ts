import { computed, observable } from "../reactive";

export class Settings {
	public readonly preferences: Preferences;
	public readonly graph: GraphSettings;
	
	public constructor(preferences: Preferences = new Preferences(), graph: GraphSettings = new GraphSettings()) {
		this.preferences = preferences;
		this.graph = graph;
	}

	public serialize() {
		return {
			preferences: this.preferences.serialize(),
			graph: this.graph.serialize()
		};
	}

	public clone(): Settings {
		return new Settings(this.preferences.clone());
	}
}

export class Preferences {
	public static deserialize(json: Record<string, any> | undefined): Preferences {
		if (!json)
			return new Preferences();
		return new Preferences(json?.["autoHideMenu"], json?.["accentColor"])
	}

	@observable
	public accessor autoHideMenu: boolean;

	@observable
	private accessor _accentColor: string;

	@computed
	public get accentColor() {
		return this._accentColor;
	}

	public set accentColor(value: string) {
		this._accentColor = value;
		document.documentElement.style.setProperty("--accent-1", value);
	}

	public constructor(autoHideMenu: boolean = false, accentColor: string = "#00b7ff") {
		this.autoHideMenu = autoHideMenu;
		this._accentColor = accentColor;
		document.documentElement.style.setProperty("--accent-1", accentColor);
	}

	public serialize() {
		return {
			autoHideMenu: this.autoHideMenu,
			accentColor: this._accentColor
		};
	}

	public clone(): Preferences {
		return new Preferences(this.autoHideMenu, this._accentColor);
	}
}


export class GraphSettings {
	public static deserialize(json: Record<string, any> | undefined): GraphSettings {
		if (!json)
			return new GraphSettings();
		return new GraphSettings(json?.["lineWidth"], json?.["curve"])
	}

	@observable
	public accessor lineWidth: number;

	@observable
	public accessor curve: number;

	public constructor(lineWidth: number = 1.5, curve: number = 1) {
		this.lineWidth = lineWidth;
		this.curve = curve;
	}

	public serialize() {
		return {
			lineWidth: this.lineWidth,
			curve: this.curve
		};
	}

	public clone(): GraphSettings {
		return new GraphSettings(this.lineWidth, this.curve);
	}
}
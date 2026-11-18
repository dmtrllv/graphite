import { computed, observable } from "../reactive";

export class Settings {
	public readonly preferences: Preferences;
	
	public constructor(preferences: Preferences = new Preferences()) {
		this.preferences = preferences;
	}

	public serialize() {
		return {
			preferences: this.preferences.serialize()
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
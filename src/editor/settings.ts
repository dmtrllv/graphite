import { computed, observable } from "../reactive";

export class Settings {
	public readonly preferences: Preferences = new Preferences();

	public clone(): Settings {
		return new Settings();
	}
}

export class Preferences {
	@observable
	public accessor autoHideMenu: boolean = true;

	@observable
	private accessor _accentColor: string = document.documentElement.style.getPropertyValue("--accent-1");

	@computed
	public get accentColor() {
		return this._accentColor;
	}

	public set accentColor(value: string) {
		this._accentColor = value;
		document.documentElement.style.setProperty("--accent-1", value);
	}
}
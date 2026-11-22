import { Settings } from ".";
import { AppSettings } from "./app";

const settingKey = (name: string) => `graphite:settings:${name}`;

export class SettingsManager {
	public readonly appSettings = this.loadAppSettings();

	public readonly defaultSettings = Settings.deserialize(new Settings(this).serialize(), { manager: this });

	private loadAppSettings() {
		const json = localStorage.getItem(settingKey("app"));

		if (!json)
			return new AppSettings();

		return AppSettings.deserialize(JSON.parse(json), { manager: this });
	}

	public loadProjectSettings(name: string) {
		const json = localStorage.getItem(settingKey(name));

		if (!json)
			return this.defaultSettings.clone();

		const data = JSON.parse(json);
		const defaults = this.defaultSettings.serialize() as any;

		return Settings.deserialize({
			...defaults,
			preferences: { ...defaults.preferences, ...(data.preferences ?? {}) },
			graph: { ...defaults.graph, ...(data.graph ?? {}) }
		}, { manager: this });
	}

	public saveProjectSettings(name: string, settings: Settings) {
		localStorage.setItem(settingKey(name), JSON.stringify(settings.serialize()));
	}

	public saveAppSettings() {
		localStorage.setItem(settingKey("app"), JSON.stringify(this.appSettings.serialize()));
	}
}

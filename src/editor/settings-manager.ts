import { GraphSettings, Preferences, Settings } from "./settings";

const settingKey = (name: string) => `graphite:settings:${name}`;

export class SettingsManager {
	public readonly defaultSettings = new Settings();

	public loadProjectSettings(name: string) {
		const json = localStorage.getItem(settingKey(name));
		if (!json)
			return this.defaultSettings.clone();
		return deserializeSettings(JSON.parse(json));
	}

	public saveProjectSettings(name: string, settings: Settings) {
		localStorage.setItem(settingKey(name), JSON.stringify(settings.serialize()));
	}
}

const deserializeSettings = (json: Record<string, any>) => {
	return new Settings(Preferences.deserialize(json["preferences"]), GraphSettings.deserialize(json["graph"]));
}
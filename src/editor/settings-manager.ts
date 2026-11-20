import { Settings } from "./settings";

const settingKey = (name: string) => `graphite:settings:${name}`;

export class SettingsManager {
	public readonly defaultSettings = new Settings();

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
		});
	}

	public saveProjectSettings(name: string, settings: Settings) {
		localStorage.setItem(settingKey(name), JSON.stringify(settings.serialize()));
	}
}

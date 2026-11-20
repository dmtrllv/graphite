import { Settings, type SettingsData } from "./settings";

const settingKey = (name: string) => `graphite:settings:${name}`;

export class SettingsManager {
	public readonly defaultSettings = Settings.deserialize({
		graph: {
			curve: 1,
			lineWidth: 1.5,
		},
		preferences: {
			_accentColor: "#00b7ff",
			autoHideMenu: false
		}
	});

	public loadProjectSettings(name: string) {
		const json = localStorage.getItem(settingKey(name));

		if (!json)
			return this.defaultSettings.clone();

		const data = JSON.parse(json) as Partial<SettingsData>;
		const defaults = this.defaultSettings.serialize();

		return Settings.deserialize({
			preferences: { ...defaults.preferences, ...(data.preferences ?? {}) },
			graph: { ...defaults.graph, ...(data.graph ?? {}) }
		});
	}

	public saveProjectSettings(name: string, settings: Settings) {
		localStorage.setItem(settingKey(name), JSON.stringify(settings.serialize()));
	}
}
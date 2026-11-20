import { Settings } from "./settings";

const settingKey = (name: string) => `graphite:settings:${name}`;

export class SettingsManager {
	public readonly defaultSettings = new Settings({ 
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
		return Settings.deserialize(JSON.parse(json));
	}

	public saveProjectSettings(name: string, settings: Settings) {
		localStorage.setItem(settingKey(name), JSON.stringify(settings.serialize()));
	}
}
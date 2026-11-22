import { memo, useState } from "react";
import { mapChildren } from "@utils";
import type { ProjectManager, Settings } from "@editor";
import { useObservable, useSubscribe } from "@reactive";
import { Toggle } from "../../inputs/toggle";
import { useEditor } from "../editor";

import "./styles/settings.scss";

const Preferences = ({ settings }: { settings: Settings }) => {
	const preferences = useObservable(settings.preferences);

	return (
		<>
			<div className="input-field">
				<Toggle label="Auto hide menubar" value={preferences.autoHideMenu} onChange={v => preferences.autoHideMenu = v} />
			</div>
			<div className="input-field">
				<label>Accent color:</label>
				<input type="color" value={preferences.accentColor} onChange={(e) => preferences.accentColor = e.target.value} />
			</div>
		</>
	);
};

const Graph = ({ settings }: { settings: Settings }) => {
	const graph = useObservable(settings.graph);

	return (
		<>
			<div className="input-field">
				<label>Line Width:</label>
				<input value={graph.lineWidth} onChange={(e) => graph.lineWidth = +e.target.value} />
			</div>
			<div className="input-field">
				<label>Curve:</label>
				<input value={graph.curve} onChange={(e) => graph.curve = +e.target.value} />
			</div>
		</>
	);
};

const App = ({ settings }: { settings: Settings }) => {
	const editor = useEditor();
	const appSettings = useObservable(settings.app);

	useSubscribe(appSettings, () => {
		editor.settings.saveAppSettings();
	}, { recursive: true });

	return (
		<>
			<div className="input-field">
				<Toggle label="Open last project" value={appSettings.openLastProjectOnStartup} onChange={v => appSettings.openLastProjectOnStartup = v} />
			</div>
		</>
	);
};

const SETTINGS = {
	Preferences,
	Graph,
	App,
} as const;

export const SettingsView = memo(({ projectManager }: { projectManager: ProjectManager }) => {
	const editor = useEditor();
	const manager = useObservable(projectManager, { recursive: true });
	const settings = manager.activeProject.settings;

	const [active, setActive] = useState<keyof typeof SETTINGS>("Preferences");

	const Component = SETTINGS[active];

	useSubscribe(settings.preferences, () => {
		const p = projectManager.activeProject;
		editor.settings.saveProjectSettings(p.info.name, p.settings);
	}, { recursive: true });

	return (
		<div className="settings-view">
			<div className="tabs">
				{mapChildren(SETTINGS, (name) => (
					<div key={name} className={`title ${active === name ? "active" : ""}`} onClick={() => setActive(name)}>
						{name}
					</div>
				))}
			</div>
			<div className="tab">
				<Component settings={settings} />
			</div>
		</div>
	);
});

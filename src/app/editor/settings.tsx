import { memo, useState } from "react";
import type { Settings } from "../../editor/settings";
import { mapChildren } from "../../utils";
import type { ProjectManager } from "../../editor/project-manager";
import { useObservable } from "../../reactive";
import { Toggle } from "../inputs/toggle";

import "./styles/settings.scss";

const Preferences = ({ settings }: { settings: Settings }) => {
	const preferences = settings.preferences;

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

const SETTINGS = {
	Preferences
} as const;

export const SettingsView = memo(({ projectManager }: { projectManager: ProjectManager }) => {
	const manager = useObservable(projectManager, { recursive: true });
	const settings = manager.activeProject.settings;

	const [active, setActive] = useState<keyof typeof SETTINGS>("Preferences");

	const Component = SETTINGS[active];

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

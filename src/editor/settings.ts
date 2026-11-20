import { computed, observable } from "../reactive";
import { Serializable, serializable } from "./serializable";

export interface PreferencesData {
	autoHideMenu: boolean;
	_accentColor: string;
}

export interface GraphSettingsData {
	lineWidth: number;
	curve: number;
}

export interface SettingsData {
	preferences: PreferencesData;
	graph: GraphSettingsData;
}

@serializable
export class Preferences extends Serializable<PreferencesData> {
	@observable
	@serializable(Boolean)
	public accessor autoHideMenu!: boolean;

	@observable
	@serializable(String)
	private accessor _accentColor!: string;

	@computed
	public get accentColor() {
		return this._accentColor;
	}

	public set accentColor(value: string) {
		this._accentColor = value;
		document.documentElement.style.setProperty("--accent-1", value);
	}

	public constructor(data: PreferencesData) {
		super(data);
	}

	protected override afterDeserialize() {
		document.documentElement.style.setProperty("--accent-1", this.accentColor);
	}
}

@serializable
export class GraphSettings extends Serializable<GraphSettingsData> {
	@observable
	@serializable(Number)
	public accessor lineWidth!: number;

	@observable
	@serializable(Number)
	public accessor curve!: number;
}

@serializable
export class Settings extends Serializable<SettingsData> {
	@serializable(Preferences)
	public readonly preferences!: Preferences;

	@serializable(GraphSettings)
	public readonly graph!: GraphSettings;
}

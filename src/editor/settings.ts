import { computed, observable } from "../reactive";
import { Serializable, serializable } from "./serializable";
@serializable
export class Preferences extends Serializable {
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

	public constructor(props: object) {
		super(props)
		document.documentElement.style.setProperty("--accent-1", this.accentColor);
	}
}

@serializable
export class GraphSettings extends Serializable {
	@observable
	public accessor lineWidth!: number;

	@observable
	public accessor curve!: number;
}

@serializable
export class Settings extends Serializable {
	@serializable(Preferences)
	public readonly preferences!: Preferences;

	@serializable(GraphSettings)
	public readonly graph!: GraphSettings;
}


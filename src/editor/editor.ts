import { EditorLayout } from "./editor-layout";
import { ProjectManager } from "./project-manager";
import { SettingsManager } from "./settings-manager";

export class Editor {
	private static _instance: Editor | null;
	
	public static readonly load = async () => {
		if(this._instance)
			return this._instance;

		this._instance = new Editor();
		await this._instance.init();
		return this._instance;
	}

	public readonly settings: SettingsManager = new SettingsManager();
	public readonly layout: EditorLayout = new EditorLayout(null);
	public readonly projectManager: ProjectManager = new ProjectManager(this);

	public async init() {}
}
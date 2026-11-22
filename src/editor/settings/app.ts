import { observable } from "@reactive";
import { serializable, Serializable } from "../serializable";

@observable
@serializable({ type: "settings:app", create: () => new AppSettings })
export class AppSettings extends Serializable {
	@observable
	@serializable(Boolean)
	public accessor openLastProjectOnStartup: boolean = false;
}
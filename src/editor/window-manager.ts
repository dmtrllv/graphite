import { observable } from "../reactive";
import type { Window } from "./window";

export class WindowManager {
	@observable
	public accessor windows: Window<any, any>[] = [];
}
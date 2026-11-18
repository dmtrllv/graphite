import { observable } from "../reactive";
import { Window } from "./window";

export class WindowManager {
	@observable
	public accessor windows: Window<any, any>[] = [];

	public open<T extends React.FC<any>>(title: string, Component: T, props: InferFCProps<T>): Window<any, any> {
		const found = this.windows.find(w => w.title === title && w.Component === Component);
		if (found)
			return found;
		const window = new Window(this, title, Component, props);
		this.windows.push(window);
		return window;
	}
}

export type InferFCProps<T> = T extends React.FC<infer P> ? P : never;
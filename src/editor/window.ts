import type React from "react";
import type { WindowManager } from "./window-manager";
import { observable } from "../reactive";

export class Window<T extends React.FC<P>, P extends {}> {
	private static _idCounter = 0;

	public readonly id: number = Window._idCounter++;
	public readonly manager: WindowManager;
	public readonly title: string;
	public readonly props: P;
	public readonly Component: T;

	@observable
	public accessor state: WindowState = WindowState.Docked;

	public constructor(manager: WindowManager, title: string, props: P, Component: T) {
		this.manager = manager;
		this.title = title;
		this.props = props;
		this.Component = Component;
	}
}

export const WindowState = {
	Docked: "Docked",
	Minimized: "Minimized",
	Maximized: "Maximized",
	Floating: "Floating",
} as const;

export type WindowState = (typeof WindowState)[keyof typeof WindowState];
import type { ComponentType } from "react";
import type { WindowManager } from "./window-manager";
import { observable } from "../reactive";

export type WindowBounds = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export class Window<P extends object = any> {
	private static _idCounter = 0;

	public readonly id: number = Window._idCounter++;
	public readonly manager: WindowManager;
	public readonly title: string;
	public readonly props: P;
	public readonly Component: ComponentType<P>;

	@observable
	public accessor state: WindowState = "docked";

	@observable
	public accessor bounds: WindowBounds = { x: 80, y: 80, width: 480, height: 320 };
	
	public readonly isSingleInstance: boolean;

	public constructor(manager: WindowManager, title: string, Component: ComponentType<P>, props: P, singleInstance: boolean) {
		this.manager = manager;
		this.title = title;
		this.Component = Component;
		this.props = props;
		this.isSingleInstance = singleInstance;
	}
}

export type WindowState = "docked" | "floating";
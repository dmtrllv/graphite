import type { ComponentType } from "react";
import type { WindowManager } from "./window-manager";
import { observable } from "../reactive";

export type WindowBounds = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type WindowOpenOptions = Partial<WindowBounds> & {
	singleInstance?: boolean;
	onClose?: () => void;
}

@observable
export class Window<P extends object = any> {
	private static _idCounter = 0;

	public readonly id: number = Window._idCounter++;
	public readonly manager: WindowManager;

	@observable
	public accessor title: string;

	public readonly props: P;
	public readonly Component: ComponentType<P & { window: Window<P> }>;

	@observable
	public accessor state: WindowState = "docked";

	@observable
	public accessor bounds: WindowBounds = { x: 80, y: 80, width: 480, height: 320 };

	public readonly isSingleInstance: boolean;

	public readonly onClose: () => void;

	public constructor(manager: WindowManager, title: string, Component: ComponentType<P & { window: Window<P> }>, props: P, options: WindowOpenOptions) {
		this.manager = manager;
		this.title = title;
		this.Component = Component;
		this.props = props;

		const {
			onClose = () => {},
			singleInstance = false,
			width = 480,
			height = 320,
			x = (window.innerWidth / 2) - (width / 2),
			y = (window.innerHeight / 2) - (height / 2),
		} = options;

		this.isSingleInstance = singleInstance;

		this.bounds = {
			width,
			height,
			x,
			y
		};
		this.onClose = onClose;
		
	}

	public close() {
		this.onClose()
	}
}

export type WindowState = "docked" | "floating";
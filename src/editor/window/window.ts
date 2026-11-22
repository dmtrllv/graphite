import type { WindowManager } from "./window-manager";
import { observable } from "@reactive";

export type WindowBounds = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type WindowOpenOptions = Partial<WindowBounds> & {
	singleInstance?: (boolean) | undefined;
	onClose?: (() => void) | undefined;
	placementKey?: (object) | undefined;
};

@observable
export class Window<P extends object = any> {
	private static _idCounter = 0;

	public readonly id: number = Window._idCounter++;
	public readonly manager: WindowManager;

	@observable
	public accessor title: string;

	public readonly component: string;
	public readonly props: P;

	@observable
	public accessor state: WindowState = "docked";

	@observable
	public accessor bounds: WindowBounds = { x: 80, y: 80, width: 480, height: 320 };

	public readonly isSingleInstance: boolean;
	public readonly onClose: () => void;

	public readonly placementKey?: object | undefined;

	public constructor(manager: WindowManager, title: string, component: string, props: P, options: WindowOpenOptions) {
		this.manager = manager;
		this.title = title;
		this.component = component;
		this.props = props;

		const {
			onClose = () => {},
			placementKey,
			singleInstance = false,
			width = 480,
			height = 320,
			x = (globalThis.window?.innerWidth ?? width) / 2 - width / 2,
			y = (globalThis.window?.innerHeight ?? height) / 2 - height / 2
		} = options;

		this.isSingleInstance = singleInstance;
		this.bounds = { width, height, x, y };
		this.onClose = onClose;
		this.placementKey = placementKey;
	}

	public close(): void {
		this.manager.close(this);
	}
}

export type WindowState = "docked" | "floating";

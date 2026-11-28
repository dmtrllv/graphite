import type { Editor } from "../editor";
import type { WindowManager } from "./window-manager";
import { observable } from "@reactive";

export type WindowBounds = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type WindowType<P extends object = {}> = {
	title: string;
	component: WindowComponent<P>;
	singleInstance?: boolean;
	float?: boolean;
	width?: number;
	height?: number;
	dockable?: boolean;
};

type WindowCreateOptions = Omit<WindowType<any>, "component">;

export type WindowProps<P extends object = {}> = {
	readonly window: Window<P>;
	readonly editor: Editor;
};

export type WindowComponent<P extends object = {}> = React.FC<WindowProps & Readonly<P>>;

@observable
export class Window<P extends object = {}> {
	public static readonly create = <P extends {}>(options: WindowCreateOptions, component: WindowComponent<P>): WindowType<P> => ({
		...options,
		component,
	});

	private static _idCounter = 0;

	public readonly id: number = Window._idCounter++;
	public readonly manager: WindowManager;

	@observable
	public accessor title: string;

	public readonly component: WindowComponent<P>;
	public readonly props: P;

	public readonly dockable: boolean;

	@observable
	public accessor state: WindowState = "docked";

	@observable
	public accessor bounds: WindowBounds = { x: 80, y: 80, width: 480, height: 320 };

	public readonly placementKey?: object | undefined;

	public constructor(manager: WindowManager, { dockable = true, title, component, width = 640, height = 480, ...props }: WindowType<P>) {
		this.manager = manager;
		this.title = title;
		this.component = component;
		this.dockable = dockable;
		this.props = props as P;

		const x = (window?.innerWidth ?? width) / 2 - width / 2;
		const y = (window?.innerHeight ?? height) / 2 - height / 2;

		this.bounds = { width, height, x, y };
	}

	public close(): void {
		this.manager.close(this);
	}
}

export type WindowState = "docked" | "floating";
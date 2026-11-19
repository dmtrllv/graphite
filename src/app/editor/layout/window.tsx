import { createContext, useContext, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Window } from "@editor/window";
import { useObservable } from "@reactive";

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export type FloatingWindowProps = {
	floatingWindow: Window;
	onWindowDrag: (window: Window, event: ReactPointerEvent) => void;
	onClose: (window: Window) => void;
};

type ResizeRef = {
	direction: ResizeDirection;
	startX: number;
	startY: number;
	bounds: Window["bounds"];
} | null

export const FloatingWindowView = ({ floatingWindow, onWindowDrag, onClose }: FloatingWindowProps) => {
	useObservable(floatingWindow);

	const resizeRef = useRef<ResizeRef>(null);

	const Component = floatingWindow.Component;

	const onResizeStart = (direction: ResizeDirection, event: ReactPointerEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		event.currentTarget.setPointerCapture(event.pointerId);

		resizeRef.current = {
			direction,
			startX: event.clientX,
			startY: event.clientY,
			bounds: { ...floatingWindow.bounds }
		};
	};

	const onResizeMove = (event: ReactPointerEvent<HTMLDivElement>) => {
		const resize = resizeRef.current;
		if (!resize)
			return;

		const { direction, bounds } = resize;
		const deltaX = event.clientX - resize.startX;
		const deltaY = event.clientY - resize.startY;
		const minWidth = 180;
		const minHeight = 120;

		let { x, y, width, height } = bounds;

		if (direction.includes("e"))
			width = Math.max(minWidth, bounds.width + deltaX);
		if (direction.includes("s"))
			height = Math.max(minHeight, bounds.height + deltaY);
		if (direction.includes("w")) {
			width = Math.max(minWidth, bounds.width - deltaX);
			x = bounds.x + bounds.width - width;
		}
		if (direction.includes("n")) {
			height = Math.max(minHeight, bounds.height - deltaY);
			y = bounds.y + bounds.height - height;
		}

		floatingWindow.bounds = { ...bounds, x, y, width, height };
	};

	const onResizeEnd = () => resizeRef.current = null;

	const directions: ResizeDirection[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

	const style = {
		left: floatingWindow.bounds.x,
		top: floatingWindow.bounds.y,
		width: floatingWindow.bounds.width,
		height: floatingWindow.bounds.height
	};

	return (
		<WindowContext.Provider value={floatingWindow}>
			<div className="floating-window" style={style}>
				<div className="floating-title" onPointerDown={event => onWindowDrag(floatingWindow, event)}>
					<span>{floatingWindow.title}</span>
					<button className="window-close" onPointerDown={event => event.stopPropagation()} onClick={() => onClose(floatingWindow)}>×</button>
				</div>
				<div className="floating-content">
					<Component window={floatingWindow} {...floatingWindow.props} />
				</div>
				{directions.map(direction => (
					<div key={direction} className={`resize-handle resize-${direction}`} onPointerDown={event => onResizeStart(direction, event)} onPointerMove={onResizeMove} onPointerUp={onResizeEnd} onPointerCancel={onResizeEnd} />
				))}
			</div>
		</WindowContext.Provider>
	);
};

export const WindowContext = createContext<null | Window<any>>(null);

export const useWindow = () => useContext(WindowContext);
import React, { createContext, useContext, useRef } from "react";
import { Window } from "@editor";
import { useObservable } from "@reactive";
import { useEditor } from "../editor";
import { clamp } from "@utils";

type ResizeDirection = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

export type FloatingWindowProps = {
	floatingWindow: Window;
	onWindowDrag: (window: Window, event: React.PointerEvent) => void;
	onClose: (window: Window) => void;
};

type ResizeRef = {
	direction: ResizeDirection;
	startX: number;
	startY: number;
	bounds: Window["bounds"];
} | null;

export const clampWindowPosition = (rect: DOMRect, x: number, y: number, width: number, height: number) => ({
	x: clamp(x, rect.x, rect.x + rect.width - width),
	y: clamp(y, 0, rect.height - height),
	width,
	height
})

export const clampWindowSize = (rect: DOMRect, x: number, y: number, width: number, height: number) => ({
	width: clamp(width, 0, rect.width - x),
	height: clamp(height, 0, rect.height - y),
})

export const FloatingWindowView = ({ floatingWindow, onWindowDrag, onClose }: FloatingWindowProps) => {
	const editor = useEditor();

	useObservable(floatingWindow);

	const resizeRef = useRef<ResizeRef>(null);
	const Component = floatingWindow.component;

	const onResizeStart = (direction: ResizeDirection, event: React.PointerEvent<HTMLDivElement>) => {
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

	const onResizeMove = (event: React.PointerEvent<HTMLDivElement>) => {
		const resize = resizeRef.current;

		if (!resize)
			return;

		const el = event.target as HTMLElement;

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

		const rect = el.parentElement!.parentElement!.getBoundingClientRect();

		if (direction.includes("n") && y <= 0) {
			y = 0;
			height = bounds.y + bounds.height;
		}

		if (direction.includes("w") && x <= rect.x) {
			x = rect.x;
			width = bounds.x + bounds.width - rect.x;
		}

		const p = clampWindowPosition(rect, x, y, width, height);
		const s = clampWindowSize(rect, p.x, p.y, width, height);

		floatingWindow.bounds = {
			...p,
			...s,
		};
	};

	const onResizeEnd = () => resizeRef.current = null;
	const directions: ResizeDirection[] = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

	const style = {
		left: floatingWindow.bounds.x,
		top: floatingWindow.bounds.y,
		width: floatingWindow.bounds.width,
		height: floatingWindow.bounds.height
	};

	const onPointerEnter = () => floatingWindow.manager.activateWindow(floatingWindow);
	const onPointerDownCapture = () => floatingWindow.manager.activateWindow(floatingWindow);

	return (
		<WindowContext.Provider value={floatingWindow}>
			<div className="floating-window" style={style} onPointerEnter={onPointerEnter} onPointerDownCapture={onPointerDownCapture}>
				<div className="floating-title" onPointerDown={event => onWindowDrag(floatingWindow, event)}>
					<span>{floatingWindow.title}</span>
					<button className="window-close" onPointerDown={event => event.stopPropagation()} onClick={() => onClose(floatingWindow)}>&times;</button>
				</div>
				<div className="floating-content">
					{Component && <Component editor={editor} window={floatingWindow} {...floatingWindow.props} />}
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

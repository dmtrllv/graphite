import React, { useCallback, useRef, useState } from "react";
import { useEvent } from "../ui/hooks";
import { LayoutView } from "./layout-view";
import { clampWindowPosition, FloatingWindowView } from "./window-view";
import type { DropTarget, DockPosition } from "./window-manager";
import { useObservable } from "@reactive";
import type { App } from "../app";
import type { Window } from "./window";

import "./styles/workspace.scss";

type DragState = {
	window: Window;
	pointerId: number;
	startX: number;
	startY: number;
	originBounds: Window["bounds"];
	sourceState: Window["state"];
	moved: boolean;
};

type WorkspaceProps = {
	app: App;
};

export const Workspace = ({ app }: WorkspaceProps) => {
	useObservable(app.windowManager);

	const workspaceRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<DragState | null>(null);
	const dropTargetRef = useRef<DropTarget>(null);

	const [dropTarget, setDropTarget] = useState<DropTarget>(null);
	const [isDragging, setIsDragging] = useState(false);

	const updateDropTarget = useCallback((target: DropTarget) => {
		const previous = dropTargetRef.current;
		if (previous?.panelId === target?.panelId && previous?.position === target?.position)
			return;

		dropTargetRef.current = target;
		setDropTarget(target);
	}, []);

	const onWindowDrag = (targetWindow: Window, event: React.PointerEvent) => {
		if (event.button !== 0)
			return;

		event.preventDefault();

		dragRef.current = {
			window: targetWindow,
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			originBounds: { ...targetWindow.bounds },
			sourceState: targetWindow.state,
			moved: false,
		};

		setIsDragging(true);
	};

	const onPointerMove = useCallback((pointerEvent: PointerEvent) => {
		const drag = dragRef.current;

		if (!drag || pointerEvent.pointerId !== drag.pointerId)
			return;

		const { window: targetWindow } = drag;
		const deltaX = pointerEvent.clientX - drag.startX;
		const deltaY = pointerEvent.clientY - drag.startY;

		if (!drag.moved && Math.hypot(deltaX, deltaY) < 4)
			return;

		drag.moved = true;

		if (drag.sourceState === "floating") {
			const { width, height, x, y } = drag.originBounds;
			const rect = workspaceRef.current!.getBoundingClientRect();

			targetWindow.bounds = clampWindowPosition(rect, x + deltaX, y + deltaY, width, height);
		}

		const element = document.elementFromPoint(pointerEvent.clientX, pointerEvent.clientY);
		const panelElement = element?.closest<HTMLElement>("[data-panel-id]");

		if (!panelElement) {
			updateDropTarget(null);
			return;
		}

		const panelId = Number(panelElement.dataset["panelId"]);
		if (!app.windowManager.getPanel(panelId)) {
			updateDropTarget(null);
			return;
		}

		const x = pointerEvent.clientX;
		const y = pointerEvent.clientY;
		const tabTitles = panelElement.querySelector<HTMLElement>(".tab-titles");
		const tabSpace = panelElement.querySelector<HTMLElement>(".tab-title-space");

		if (tabTitles) {
			const rect = tabTitles.getBoundingClientRect();

			if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
				if (tabSpace) {
					const space = tabSpace.getBoundingClientRect();

					if (x >= space.left && x <= space.right && y >= space.top && y <= space.bottom) {
						updateDropTarget({ panelId, position: "center" });
						return;
					}
				}

				updateDropTarget({ panelId, position: "float" });
				return;
			}
		}

		const content = panelElement.querySelector<HTMLElement>(".tabs");
		if (!content) {
			updateDropTarget({ panelId, position: "float" });
			return;
		}

		const rect = content.getBoundingClientRect();
		const localX = x - rect.left;
		const localY = y - rect.top;
		const edge = Math.min(120, Math.min(rect.width, rect.height) * 0.22);

		const distances: [DockPosition, number][] = [
			["left", localX],
			["right", rect.width - localX],
			["top", localY],
			["bottom", rect.height - localY]
		];

		const nearest = distances.reduce((a, b) => a[1] < b[1] ? a : b);
		const position: DockPosition | "float" = nearest[1] < edge ? nearest[0] : "float";

		updateDropTarget({ panelId, position });
	}, []);

	const onPointerUp = useCallback((pointerEvent: PointerEvent) => {
		const drag = dragRef.current;

		if (!drag || pointerEvent.pointerId !== drag.pointerId)
			return;

		const { window: targetWindow } = drag;

		if (drag.moved) {
			const target = dropTargetRef.current;
			const panel = target ? app.windowManager.getPanel(target.panelId) : null;

			if (panel && target) {
				if (target.position === "float") {
					const rect = workspaceRef.current?.getBoundingClientRect();

					app.windowManager.float(targetWindow, {
						x: pointerEvent.clientX - (rect?.left ?? 0) - 140,
						y: pointerEvent.clientY - (rect?.top ?? 0) - 16
					});
				} else {
					app.windowManager.dock(targetWindow, panel, target.position);
				}
			} else if (drag.sourceState === "docked") {
				const rect = workspaceRef.current?.getBoundingClientRect();

				app.windowManager.float(targetWindow, {
					x: pointerEvent.clientX - (rect?.left ?? 0) - 140,
					y: pointerEvent.clientY - (rect?.top ?? 0) - 16
				});
			} else {
				const rect = workspaceRef.current?.getBoundingClientRect();

				if (rect && pointerEvent.clientX >= rect.left && pointerEvent.clientX <= rect.right && pointerEvent.clientY >= rect.top && pointerEvent.clientY <= rect.bottom)
					app.windowManager.dockToRoot(targetWindow);
			}
		}

		if (drag.sourceState === "floating" && drag.moved) {
			const { width, height } = drag.originBounds;
			const rect = workspaceRef.current!.getBoundingClientRect();
			const x = drag.originBounds.x + pointerEvent.clientX - drag.startX;
			const y = drag.originBounds.y + pointerEvent.clientY - drag.startY;

			targetWindow.bounds = clampWindowPosition(rect, x, y, width, height);
		}

		dragRef.current = null;
		setIsDragging(false);
		updateDropTarget(null);
	}, []);

	useEvent("pointermove", onPointerMove);
	useEvent("pointerup", onPointerUp);
	useEvent("pointercancel", onPointerUp);

	return (
		<div className="editor-workspace" ref={workspaceRef}>
			<LayoutView layout={app.layout} onWindowDrag={onWindowDrag} dropTarget={dropTarget} />
			<div className={`floating-windows${isDragging ? " dragging" : ""}`}>
				{app.windowManager.floatingWindows.map(floatingWindow => (
					<FloatingWindowView key={floatingWindow.id} floatingWindow={floatingWindow} onWindowDrag={onWindowDrag} onClose={window => app.windowManager.close(window)} />
				))}
			</div>
		</div>
	);
};

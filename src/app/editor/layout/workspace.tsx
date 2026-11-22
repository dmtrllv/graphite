import React, { useRef, useState } from "react";
import type { DockPosition, DropTarget, Editor, Window } from "@editor"
import { useObservable } from "@reactive";
import { LayoutView } from "./layout";
import { FloatingWindowView } from "./window";

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

export const Workspace = ({ editor }: { editor: Editor }) => {
	useObservable(editor.layout);
	useObservable(editor.windowManager);

	const workspaceRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<DragState | null>(null);
	const dropTargetRef = useRef<DropTarget>(null);
	const moveFrameRef = useRef<number | null>(null);
	const [dropTarget, setDropTarget] = useState<DropTarget>(null);
	const [isDragging, setIsDragging] = useState(false);

	const updateDropTarget = (target: DropTarget) => {
		const previous = dropTargetRef.current;
		if (previous?.panelId === target?.panelId && previous?.position === target?.position)
			return;

		dropTargetRef.current = target;
		setDropTarget(target);
	};

	const onWindowDrag = (targetWindow: Window, event: React.PointerEvent) => {
		if (event.button !== 0)
			return;

		event.preventDefault();

		const drag: DragState = {
			window: targetWindow,
			pointerId: event.pointerId,
			startX: event.clientX,
			startY: event.clientY,
			originBounds: { ...targetWindow.bounds },
			sourceState: targetWindow.state,
			moved: false,
		};

		dragRef.current = drag;
		setIsDragging(true);

		const onMove = (pointerEvent: PointerEvent) => {
			if (pointerEvent.pointerId !== drag.pointerId)
				return;

			const deltaX = pointerEvent.clientX - drag.startX;
			const deltaY = pointerEvent.clientY - drag.startY;

			if (!drag.moved && Math.hypot(deltaX, deltaY) < 4)
				return;

			drag.moved = true;

			if (drag.sourceState === "floating") {
				if (moveFrameRef.current !== null)
					cancelAnimationFrame(moveFrameRef.current);

				moveFrameRef.current = requestAnimationFrame(() => {
					targetWindow.bounds = {
						...drag.originBounds,
						x: drag.originBounds.x + deltaX,
						y: drag.originBounds.y + deltaY
					};
					moveFrameRef.current = null;
				});
			}

			const element = document.elementFromPoint(pointerEvent.clientX, pointerEvent.clientY);
			const panelElement = element?.closest<HTMLElement>("[data-panel-id]");

			if (!panelElement) {
				updateDropTarget(null);
				return;
			}

			const panelId = Number(panelElement.dataset["panelId"]);
			if (!editor.windowManager.getPanel(panelId)) {
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
		};

		const onUp = (pointerEvent: PointerEvent) => {
			if (pointerEvent.pointerId !== drag.pointerId)
				return;

			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			window.removeEventListener("pointercancel", onUp);

			if (drag.moved) {
				const target = dropTargetRef.current;
				const panel = target ? editor.windowManager.getPanel(target.panelId) : null;

				if (panel && target) {
					if (target.position === "float") {
						const rect = workspaceRef.current?.getBoundingClientRect();
						editor.windowManager.float(targetWindow, {
							x: pointerEvent.clientX - (rect?.left ?? 0) - 140,
							y: pointerEvent.clientY - (rect?.top ?? 0) - 16
						});
					} else {
						editor.windowManager.dock(targetWindow, panel, target.position);
					}
				} else if (drag.sourceState === "docked") {
					const rect = workspaceRef.current?.getBoundingClientRect();
					editor.windowManager.float(targetWindow, {
						x: pointerEvent.clientX - (rect?.left ?? 0) - 140,
						y: pointerEvent.clientY - (rect?.top ?? 0) - 16
					});
				} else {
					const rect = workspaceRef.current?.getBoundingClientRect();

					if (rect && pointerEvent.clientX >= rect.left && pointerEvent.clientX <= rect.right && pointerEvent.clientY >= rect.top && pointerEvent.clientY <= rect.bottom)
						editor.windowManager.dockToRoot(targetWindow);
				}
			}

			if (drag.sourceState === "floating" && drag.moved) {
				targetWindow.bounds = {
					...drag.originBounds,
					x: drag.originBounds.x + pointerEvent.clientX - drag.startX,
					y: drag.originBounds.y + pointerEvent.clientY - drag.startY
				};
			}

			if (moveFrameRef.current !== null) {
				cancelAnimationFrame(moveFrameRef.current);
				moveFrameRef.current = null;
			}

			setIsDragging(false);
			dragRef.current = null;
			updateDropTarget(null);
		};

		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		window.addEventListener("pointercancel", onUp);
	};

	return (
		<div className="editor-workspace" ref={workspaceRef}>
			<LayoutView layout={editor.layout} onWindowDrag={onWindowDrag} dropTarget={dropTarget} />
			<div className={`floating-windows${isDragging ? " dragging" : ""}`}>
				{editor.windowManager.floatingWindows.map(floatingWindow => (
					<FloatingWindowView key={floatingWindow.id} floatingWindow={floatingWindow} onWindowDrag={onWindowDrag} onClose={window => editor.windowManager.close(window)} />
				))}
			</div>
		</div>
	);
};
import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Editor } from "../../editor";
import type { Window } from "../../editor/window";
import type { DockPosition } from "../../editor/window-manager";
import { useObservable } from "../../reactive";
import { LayoutView } from "./layout";
import { MenuBarView } from "./menubar";

import "./styles/editor.scss";

type DropTarget = { panelId: number; position: DockPosition } | null;

type DragState = {
	window: Window;
	pointerId: number;
	startX: number;
	startY: number;
	originBounds: Window["bounds"];
	sourceState: Window["state"];
	moved: boolean;
};

export const EditorView = ({ editor }: { editor: Editor }) => {
	useObservable(editor.layout);
	useObservable(editor.windowManager);

	const workspaceRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<DragState | null>(null);
	const dropTargetRef = useRef<DropTarget>(null);
	const [dropTarget, setDropTarget] = useState<DropTarget>(null);

	const updateDropTarget = (target: DropTarget) => {
		const previous = dropTargetRef.current;
		if (previous?.panelId === target?.panelId && previous?.position === target?.position)
			return;
		dropTargetRef.current = target;
		setDropTarget(target);
	};

	const onWindowDrag = (targetWindow: Window, event: ReactPointerEvent) => {
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
			moved: false
		};
		dragRef.current = drag;

		const onMove = (pointerEvent: PointerEvent) => {
			if (pointerEvent.pointerId !== drag.pointerId)
				return;

			const deltaX = pointerEvent.clientX - drag.startX;
			const deltaY = pointerEvent.clientY - drag.startY;

			if (!drag.moved && Math.hypot(deltaX, deltaY) < 4)
				return;

			drag.moved = true;

			if (drag.sourceState === "floating") {
				targetWindow.bounds = {
					...drag.originBounds,
					x: drag.originBounds.x + deltaX,
					y: drag.originBounds.y + deltaY
				};
			}

			const element = document.elementFromPoint(pointerEvent.clientX, pointerEvent.clientY);
			const panelElement = element?.closest<HTMLElement>("[data-panel-id]");

			if (!panelElement) {
				updateDropTarget(null);
				return;
			}

			const rect = panelElement.getBoundingClientRect();
			const x = pointerEvent.clientX - rect.left;
			const y = pointerEvent.clientY - rect.top;
			const edge = Math.min(rect.width, rect.height) * 0.22;
			const distances: [DockPosition, number][] = [
				["left", x],
				["right", rect.width - x],
				["top", y],
				["bottom", rect.height - y]
			];
			const nearest = distances.reduce((a, b) => a[1] < b[1] ? a : b);

			const position = nearest[1] < edge ? nearest[0] : "center";
			const panelId = Number(panelElement.dataset["panelId"]);
			updateDropTarget(editor.windowManager.getPanel(panelId) ? { panelId, position } : null);
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

				if (panel && target)
					editor.windowManager.dock(targetWindow, panel, target.position);
				else if (drag.sourceState === "docked") {
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

			dragRef.current = null;
			updateDropTarget(null);
		};

		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		window.addEventListener("pointercancel", onUp);
	};

	return (
		<div className="editor-shell">
			<MenuBarView editor={editor} />
			<div className="editor-workspace" ref={workspaceRef}>
				<LayoutView layout={editor.layout} onWindowDrag={onWindowDrag} dropTarget={dropTarget} />
				<div className="floating-windows">
					{editor.windowManager.floatingWindows.map(floatingWindow => (
						<div
							key={floatingWindow.id}
							className="floating-window"
							style={{
								left: floatingWindow.bounds.x,
								top: floatingWindow.bounds.y,
								width: floatingWindow.bounds.width,
								height: floatingWindow.bounds.height
							}}
							onPointerUp={event => {
								const rect = event.currentTarget.getBoundingClientRect();
								const workspace = workspaceRef.current?.getBoundingClientRect();
								if (!workspace)
									return;
								floatingWindow.bounds = {
									x: rect.left - workspace.left,
									y: rect.top - workspace.top,
									width: rect.width,
									height: rect.height
								};
							}}
						>
							<div className="floating-title" onPointerDown={event => onWindowDrag(floatingWindow, event)}>
								<span>{floatingWindow.title}</span>
								<button className="window-close" onPointerDown={event => event.stopPropagation()} onClick={() => editor.windowManager.close(floatingWindow)}>×</button>
							</div>
							<div className="floating-content">
								<floatingWindow.Component {...floatingWindow.props} />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
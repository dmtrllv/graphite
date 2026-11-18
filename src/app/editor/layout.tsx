import { Fragment, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { EditorLayout } from "../../editor/editor-layout";
import type { DockPosition } from "../../editor/window-manager";
import type { Window } from "../../editor/window";
import { useObservable } from "../../reactive";
import { PanelView } from "./panel";

import "./styles/layout.scss";

type DropTarget = { panelId: number; position: DockPosition } | null;

export const LayoutView = ({ layout, onWindowDrag, dropTarget }: {
	layout: EditorLayout;
	onWindowDrag: (window: Window, event: React.PointerEvent) => void;
	dropTarget: DropTarget;
}) => {
	useObservable(layout);

	return (
		<div className={`layout ${layout.direction}`} style={{ flex: `${layout.size} 1 0px` }}>
			{layout.children.map((child, index) => (
				<Fragment key={child.id}>
					{child instanceof EditorLayout
						? <LayoutView layout={child} onWindowDrag={onWindowDrag} dropTarget={dropTarget} />
						: <PanelView panel={child} onWindowDrag={onWindowDrag} dropPosition={dropTarget?.panelId === child.id ? dropTarget.position : null} />}
					{index < layout.children.length - 1 && <SplitHandle layout={layout} index={index} />}
				</Fragment>
			))}
		</div>
	);
};

const SplitHandle = ({ layout, index }: { layout: EditorLayout; index: number }) => {
	const previousPosition = useRef<number | null>(null);

	const getPosition = (event: ReactPointerEvent) => layout.direction === "horizontal" ? event.clientX : event.clientY;

	const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.stopPropagation();
		previousPosition.current = getPosition(event);
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
		if (previousPosition.current === null)
			return;

		const position = getPosition(event);
		const delta = position - previousPosition.current;
		previousPosition.current = position;

		const rect = event.currentTarget.parentElement!.getBoundingClientRect();
		const totalSize = layout.direction === "horizontal" ? rect.width : rect.height;
		layout.resize(index, delta, totalSize);
	};

	const onPointerUp = () => previousPosition.current = null;

	return (
		<div
			className={`layout-splitter ${layout.direction}`}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerUp}
		/>
	);
};
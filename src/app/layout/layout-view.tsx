import React, { Fragment, useRef } from "react";
import  { type Window, Layout, type DropTarget } from ".";
import { useObservable } from "@reactive";
import { PanelView } from "./panel-view";

import "./styles/layout.scss";

type LayoutViewProps = {
	layout: Layout;
	onWindowDrag: (window: Window, event: React.PointerEvent) => void;
	dropTarget: DropTarget;
};

export const LayoutView = ({ layout, onWindowDrag, dropTarget }: LayoutViewProps) => {
	useObservable(layout);

	return (
		<div className={`layout ${layout.direction}`} style={{ flex: `${layout.size} 1 0px` }}>
			{layout.children.map((child, index) => (
				<Fragment key={`${child instanceof Layout ? "layout" : "panel"}-${child.id}`}>
					{child instanceof Layout
						? <LayoutView layout={child} onWindowDrag={onWindowDrag} dropTarget={dropTarget} />
						: <PanelView panel={child} onWindowDrag={onWindowDrag} dropPosition={dropTarget?.panelId === child.id && dropTarget.position !== "float" ? dropTarget.position : null} />}
					{index < layout.children.length - 1 && <SplitHandle layout={layout} index={index} />}
				</Fragment>
			))}
		</div>
	);
};

const SplitHandle = ({ layout, index }: { layout: Layout; index: number }) => {
	const previousPosition = useRef<number | null>(null);

	const getPosition = (event: React.PointerEvent) => layout.direction === "horizontal" ? event.clientX : event.clientY;

	const props: React.HTMLProps<HTMLDivElement> = {
		onPointerDown: e => {
			e.preventDefault();
			e.stopPropagation();
			previousPosition.current = getPosition(e);
			e.currentTarget.setPointerCapture(e.pointerId);
		},
		onPointerMove: e => {
			if (previousPosition.current === null)
				return;

			const position = getPosition(e);
			const delta = position - previousPosition.current;
			previousPosition.current = position;

			const first = e.currentTarget.previousElementSibling?.getBoundingClientRect();
			const second = e.currentTarget.nextElementSibling?.getBoundingClientRect();
			if (!first || !second)
				return;

			const totalSize = layout.direction === "horizontal" ? first.width + second.width : first.height + second.height;

			layout.resize(index, delta, totalSize);
		},
		onPointerUp: () => {
			previousPosition.current = null
		},
	};

	return (
		<div className={`layout-splitter ${layout.direction}`} {...props} />
	);
};
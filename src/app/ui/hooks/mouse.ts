import { useState } from "react";
import { useEvent } from "./event";

type Vec2 = [number, number];

const cloneVec2 = (v: Vec2) => [...v] as Vec2;

type MouseState = {
	isDown: boolean;
	downPosition: Vec2;
	startOffset: Vec2;
	position: Vec2;
};

export const useMouseMove = (startPosition: Vec2, onMove: (newPosition: Vec2, offset: Vec2) => void = () => {}, scale: number = 1, inverseY: boolean = false, button: 0 | 1 | 2 = 0) => {
	const [state, setState] = useState<MouseState>({
		isDown: false,
		downPosition: [0, 0],
		startOffset: cloneVec2(startPosition),
		position: cloneVec2(startPosition),
	});

	const update = (state: Partial<MouseState>) => setState(s => ({ ...s, ...state }));

	const onMouseDown = (e: React.MouseEvent) => {
		if (e.button !== button)
			return;
		e.stopPropagation();
		update({
			isDown: true,
			startOffset: cloneVec2(state.position),
			downPosition: [e.clientX, e.clientY],
		});
	};

	useEvent("mousemove", (e) => {
		if (!state.isDown)
			return;

		let delta: Vec2;

		if (inverseY)
			delta = [(e.clientX - state.downPosition[0]) * scale, (state.downPosition[1] - e.clientY) * scale];
		else
			delta = [(e.clientX - state.downPosition[0]) * scale, (e.clientY - state.downPosition[1]) * scale];

		const d = cloneVec2(delta);
		const position: Vec2 = [delta[0] + state.startOffset[0], delta[1] + state.startOffset[1]];
		onMove(position, d);
		update({ position })
	}, undefined, [scale]);

	useEvent("mouseup", e => {
		if (state.isDown) {
			e.stopPropagation();
			state.isDown = false
		};
	});

	return {
		startMouseMove: onMouseDown,
		position: state.position,
	};
};
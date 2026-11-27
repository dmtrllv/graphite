import { useState } from "react";
import { useEvent } from "./event";

type Vec2 = {
	x: number,
	y: number
}

const cloneVec2 = ({ x, y }: Vec2) => {
	return { x, y };
};

type MouseState = {
	isDown: boolean;
	downPosition: {
		x: number;
		y: number;
	};
	startOffset: {
		x: number;
		y: number;
	};
};

export const useMouseMove = (startPosition: Vec2, onMove: (newPosition: Vec2, offset: Vec2) => void, scale: number = 1, inverseY: boolean = false, button: 0 | 1 | 2 = 0) => {
	const [state, setState] = useState<MouseState>({
		isDown: false,
		downPosition: { x: 0, y: 0 },
		startOffset: cloneVec2(startPosition),
	});

	const update = (state: Partial<MouseState>) => setState(s => ({ ...s, ...state }));

	const onMouseDown = (e: React.MouseEvent) => {
		if (e.button !== button)
			return;
		e.stopPropagation();
		update({
			isDown: true,
			startOffset: cloneVec2(startPosition),
			downPosition: { x: e.clientX, y: e.clientY },
		});
	};

	useEvent("mousemove", (e) => {
		if (!state.isDown)
			return;

		let delta;
		if (inverseY)
			delta = { x: e.clientX - state.downPosition.x, y: state.downPosition.y - e.clientY };
		else
			delta = { x: e.clientX - state.downPosition.x, y: e.clientY - state.downPosition.y };
		delta.x *= scale;
		delta.y *= scale;
		const d = cloneVec2(delta);
		onMove({ x: delta.x + state.startOffset.x, y: delta.y + state.startOffset.y }, d);
	}, undefined, [scale]);

	useEvent("mouseup", e => {
		if (state.isDown) {
			e.stopPropagation();
			state.isDown = false
		};
	});

	return onMouseDown;
};
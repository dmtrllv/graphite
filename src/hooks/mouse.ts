import { useObservable } from "../reactive/hook";
import { useEvent } from "./event";

type Vec2 = {
	x: number,
	y: number
}

const cloneVec2 = ({ x, y }: Vec2) => {
	return { x, y };
}

export const useMouseMove = (startPosition: Vec2, onMove: (newPosition: Vec2, offset: Vec2) => void, scale: number, inverseY: boolean = false, button: 0 | 1 | 2 = 0) => {
	const moveState = useObservable(() => ({
		isDown: false,
		downPosition: { x: 0, y: 0 },
		startOffset: cloneVec2(startPosition),
	}));

	const onMouseDown = (e: React.MouseEvent) => {
		if (e.button !== button)
			return;
		e.stopPropagation();
		moveState.isDown = true;
		moveState.startOffset = cloneVec2(startPosition);
		moveState.downPosition = { x: e.clientX, y: e.clientY };
	};

	useEvent("mousemove", (e) => {
		if (!moveState.isDown)
			return;

		let delta;
		if (inverseY)
			delta = { x: e.clientX - moveState.downPosition.x, y: moveState.downPosition.y - e.clientY };
		else
			delta = { x: e.clientX - moveState.downPosition.x, y: e.clientY - moveState.downPosition.y };
		delta.x *= scale;
		delta.y *= scale;
		const d = cloneVec2(delta);
		onMove({ x: delta.x + moveState.startOffset.x, y: delta.y + moveState.startOffset.y }, d);
	}, undefined, [scale]);

	useEvent("mouseup", e => {
		if (moveState.isDown) {
			e.stopPropagation();
			moveState.isDown = false
		};
	});

	return {
		onMouseDown
	};
};
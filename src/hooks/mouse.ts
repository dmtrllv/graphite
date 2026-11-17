import { Vec2 } from "../graph";
import { useObservable } from "../reactive/hook";
import { useEvent } from "./event";

export const useMouseMove = (startPosition: Vec2, onMove: (newPosition: Vec2, offset: Vec2) => void, scale: number, inverseY: boolean = false, button: 0 | 1 | 2 = 0) => {
	const moveState = useObservable(() => ({
		isDown: false,
		downPosition: new Vec2(0, 0),
		startOffset: startPosition.clone(),
	}));

	const onMouseDown = (e: React.MouseEvent) => {
		if (e.button !== button)
			return;
		e.stopPropagation();
		moveState.isDown = true;
		moveState.startOffset = startPosition.clone();
		moveState.downPosition = new Vec2(e.clientX, e.clientY);
	};

	useEvent("mousemove", (e) => {
		if (!moveState.isDown)
			return;

		let delta;
		if (inverseY)
			delta = new Vec2(e.clientX - moveState.downPosition.x, moveState.downPosition.y - e.clientY);
		else
			delta = new Vec2(e.clientX, e.clientY).sub(moveState.downPosition);
		const d = delta.mul(scale).clone();
		onMove(delta.add(moveState.startOffset), d);
	}, undefined, [scale]);

	useEvent("mouseup", e => {
		if (moveState.isDown) {
			//e.stopPropagation();
			moveState.isDown = false
		};
	});

	return {
		onMouseDown
	};
};
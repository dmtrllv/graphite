import { Vec2 } from "../graph";
import { useObservable } from "../reactive/hook";
import { useEvent } from "./event";

export const useMouseMove = (startPosition: Vec2, onMove: (newPosition: Vec2) => void, inverseY: boolean = false) => {
	const moveState = useObservable(() => ({
		isDown: false,
		downPosition: new Vec2(0, 0),
		startOffset: startPosition.clone(),
	}));

	const onMouseDown = (e: React.MouseEvent) => {
		e.preventDefault();
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

		onMove(delta.add(moveState.startOffset))
	});

	useEvent("mouseup", _ => moveState.isDown = false);

	return {
		onMouseDown,
	};
};
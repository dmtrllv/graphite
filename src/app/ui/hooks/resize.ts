import { useEffect } from "react";

export const useResizeObserver = (ref: React.RefObject<HTMLElement | null>, onResize: () => void) => {
	useEffect(() => {
		let initial = true;

		const resizeObserver = new ResizeObserver(() => {
			if(initial) {
				initial = false;
				return;
			}
			onResize()
		});

		if (ref.current)
			resizeObserver.observe(ref.current)

		return () => {
			resizeObserver.disconnect();
			if (ref.current)
				resizeObserver.unobserve(ref.current);
		}
	}, [ref, onResize]);

	return ref;
}
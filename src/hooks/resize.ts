import { useEffect, useRef } from "react";

export const useResizeObserver = (onResize: () => void, r?: React.RefObject<HTMLElement | null>) => {
	const ref = r || useRef<HTMLElement>(null);

	useEffect(() => {
		const resizeObserver = new ResizeObserver(() => onResize());

		if (ref.current)
			resizeObserver.observe(ref.current)

		return () => {
			resizeObserver.disconnect();
			if (ref.current)
				resizeObserver.unobserve(ref.current);
		}
	}, []);

	return ref;
}
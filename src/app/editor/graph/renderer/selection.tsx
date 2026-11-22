import type { GraphEditor } from "@editor";
import type React from "react";

export const getSelectionStyle = (editor: GraphEditor, root: HTMLDivElement | null): React.CSSProperties => {
	const style: React.CSSProperties = {};
	const selection = editor.selection;

	if (!selection || !root)
		return style;

	const rect = root.getBoundingClientRect();
	const down = selection.downPos;
	const mouse = selection.mousePos;

	style.left = Math.min(down.x, mouse.x) - rect.left;
	style.top = Math.min(down.y, mouse.y) - rect.top;
	style.width = Math.abs(down.x - mouse.x);
	style.height = Math.abs(down.y - mouse.y);
	style.border = "1px solid var(--accent-1)";
	style.backgroundColor = "color-mix(in srgb, var(--accent-1) 30%, transparent)";
	style.position = "absolute";
	style.pointerEvents = "none";

	return style;
};
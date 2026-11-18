import { EditorLayout } from "../../editor/editor-layout";
import { useObservable } from "../../reactive";
import { PanelView } from "./panel";

import "./styles/layout.scss";

export const LayoutView = ({ layout }: { layout: EditorLayout }) => {
	useObservable(layout);

	return (
		<div className={`layout ${layout.direction}`}>
			{layout.children.map(child => {
				if (child instanceof EditorLayout)
					return <LayoutView key={`layout-${layout.id}`} layout={child} />;
				return <PanelView key={`layout-${layout.id}`} panel={child} />;
			})}
		</div>
	);
};
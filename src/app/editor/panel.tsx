import type { PointerEvent as ReactPointerEvent } from "react";
import { LayoutPanel } from "../../editor/editor-layout";
import type { DockPosition } from "../../editor/window-manager";
import type { Window } from "../../editor/window";
import { useObservable } from "../../reactive";

import "./styles/panel.scss";

export const PanelView = ({ panel, onWindowDrag, dropPosition }: {
	panel: LayoutPanel;
	onWindowDrag: (window: Window, event: ReactPointerEvent) => void;
	dropPosition: DockPosition | null;
}) => {
	useObservable(panel);

	const activeWindow = panel.tabs[panel.activeTab];
	const Component = activeWindow?.Component;

	return (
		<div
			className={`panel${dropPosition ? ` drop-target drop-${dropPosition}` : ""}`}
			data-panel-id={panel.id}
			style={{ flex: `${panel.size} 1 0px` }}
		>
			<div className="tab-titles">
				{panel.tabs.map((tab, index) => (
					<div
						key={tab.id}
						className={`title${panel.activeTab === index ? " active" : ""}`}
						onClick={() => panel.activate(tab)}
						onPointerDown={event => onWindowDrag(tab, event)}
					>
						<span>{tab.title}</span>
						<button className="window-close" onPointerDown={event => event.stopPropagation()} onClick={() => tab.manager.close(tab)}>×</button>
					</div>
				))}
			</div>
			<div className="tabs">
				{activeWindow && Component && (
					<div className="tab active">
						<Component {...activeWindow.props} />
					</div>
				)}
			</div>
		</div>
	);
};
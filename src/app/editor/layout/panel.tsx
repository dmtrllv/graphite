import React, { useMemo } from "react";
import { LayoutPanel, type DockPosition, type Window } from "@editor";
import { useObservable } from "@reactive";
import { WindowContext } from "./window";

import "./styles/panel.scss";

type PanelViewProps = {
	panel: LayoutPanel;
	dropPosition: DockPosition | null;
	onWindowDrag: (window: Window, event: React.PointerEvent) => void;
};

export const PanelView = ({ panel, onWindowDrag, dropPosition }: PanelViewProps) => {
	useObservable(panel);

	const activeWindow = panel.tabs[panel.activeTab];
	const Component = activeWindow?.Component;

	const className = useMemo(() => `panel${dropPosition ? ` drop-target drop-${dropPosition}` : ""}`, [dropPosition]);
	const style = useMemo(() => ({ flex: `${panel.size} 1 0px` }), [panel.size]);

	return (
		<div className={className} data-panel-id={panel.id} style={style}>
			<div className="tab-titles">
				{panel.tabs.map((tab, index) => {
					const className = `title${panel.activeTab === index ? " active" : ""}`;
					return (
						<div key={tab.id} className={className} onClick={() => panel.activate(tab)} onPointerDown={event => onWindowDrag(tab, event)}>
							<span>{tab.title}</span>
							<button className="window-close" onPointerDown={event => event.stopPropagation()} onClick={() => tab.manager.close(tab)}>
								×
							</button>
						</div>
					);
				})}
				<div className="tab-title-space" data-dock-center />
			</div>
			<div className="tabs">
				{activeWindow && Component && (
					<div className="tab active">
						<WindowContext value={activeWindow}>
							<Component window={activeWindow} {...activeWindow.props} />
						</WindowContext>
					</div>
				)}
			</div>
		</div>
	);
};
import React, { useMemo } from "react";
import { LayoutPanel, type DockPosition, type Window } from "@editor";
import { useObservable } from "@reactive";
import { WindowContext } from "./window";

import "./styles/panel.scss";
import { useEditor } from "../editor";

type PanelViewProps = {
	panel: LayoutPanel;
	dropPosition: DockPosition | null;
	onWindowDrag: (window: Window, event: React.PointerEvent) => void;
};

export const PanelView = ({ panel, onWindowDrag, dropPosition }: PanelViewProps) => {
	const editor = useEditor();
	useObservable(panel);

	const activeWindow = panel.tabs[panel.activeTab];
	const Component = activeWindow ? activeWindow.component : undefined;

	const className = useMemo(() => `panel${dropPosition ? ` drop-target drop-${dropPosition}` : ""}`, [dropPosition]);
	const style = useMemo(() => ({ flex: `${panel.size} 1 0px` }), [panel.size]);

	const onPointerEnter = () => activeWindow?.manager.activateWindow(activeWindow);
	const onPointerDownCapture = () => activeWindow?.manager.activateWindow(activeWindow);

	return (
		<div className={className} data-panel-id={panel.id} style={style} onPointerEnter={onPointerEnter} onPointerDownCapture={onPointerDownCapture}>
			<div className="tab-titles">
				{panel.tabs.map((tab, index) => {
					const className = `title${panel.activeTab === index ? " active" : ""}`;

					return (
						<div key={tab.id} className={className} onClick={() => tab.manager.activateWindow(tab)} onPointerDown={event => onWindowDrag(tab, event)}>
							<span>{tab.title}</span>
							<button className="window-close" onPointerDown={event => event.stopPropagation()} onClick={() => tab.manager.close(tab)}>
								&times;
							</button>
						</div>
					);
				})}
				<div className="tab-title-space" data-dock-center />
			</div>
			<div className="tabs">
				{activeWindow && Component && (
					<div className="tab active">
						<WindowContext.Provider value={activeWindow}>
							<Component editor={editor} window={activeWindow} {...activeWindow.props} />
						</WindowContext.Provider>
					</div>
				)}
			</div>
		</div>
	);
};

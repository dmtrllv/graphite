import { LayoutPanel } from "../../editor/editor-layout";
import { useObservable } from "../../reactive";

import "./styles/panel.scss";

export const PanelView = ({ panel }: { panel: LayoutPanel }) => {
	useObservable(panel);

	return (
		<div className="panel">
			<div className="tab-titles">
				{panel.tabs.map((tab, i) => (
					<div key={tab.id} className={`title ${panel.activeTab === i ? "active" : ""}`}>{tab.title}</div>
				))}
			</div>
			<div className="tabs">
				{panel.tabs.map((tab, i) => (
					<div className={`tab ${panel.activeTab === i ? "active" : ""}`}>
						<tab.Component {...tab.props} />
					</div>
				))}
			</div>
		</div>
	);
};
import { LayoutPanel } from "../../editor/editor-layout";
import { useObservable } from "../../reactive";

export const PanelView = ({ panel }: { panel: LayoutPanel<any, any> }) => {
	useObservable(panel);

	return (
		<div className="panel">
			<div className="tab-titles">
				{panel.tabs.map(tab => (
					<div key={tab.id} >{tab.title}</div>
				))}
			</div>
			<div className="tabs">
				{panel.tabs.map(tab => (
					<div key={tab.id}>{tab.title}</div>
				))}
			</div>
		</div>
	);
};
type GraphPropertiesHeaderProps = {
	isWorldGraph: boolean;
	collapsed: boolean;
	onToggle: () => void;
};

export const GraphPropertiesHeader = ({ isWorldGraph, collapsed, onToggle }: GraphPropertiesHeaderProps) => (
	<div className="header">
		{isWorldGraph ? "World" : "Graph Properties"}
		<button className="btn-collapse" onClick={onToggle}>{collapsed ? ">" : "V"}</button>
	</div>
);
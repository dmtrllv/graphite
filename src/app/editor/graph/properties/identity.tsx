import type { Graph } from "@editor";
import React from "react";
import { useWindow } from "../../layout";

type GraphIdentityProps = {
	graph: Graph;
};

export const GraphIdentity = ({ graph }: GraphIdentityProps) => {
	const manager = graph.manager!;
	const window = useWindow();

	const removeGraph = () => {
		manager.removeGraph(graph);
		window?.close();
	};

	const rename = (event: React.ChangeEvent<HTMLInputElement>) => {
		manager.rename(graph, event.target.value);

		if (window)
			window.title = event.target.value;
	};

	return (
		<div className="group">
			<label>Graph name:</label>
			<input value={graph.name} onChange={rename} />
			<button className="btn-delete" onClick={removeGraph}>Delete</button>
		</div>
	);
};
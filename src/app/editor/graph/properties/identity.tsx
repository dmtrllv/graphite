import type { Graph } from "@editor";
import React, { useEffect, useState } from "react";
import { useWindow } from "../../layout";

type GraphIdentityProps = {
	graph: Graph;
};

export const GraphIdentity = ({ graph }: GraphIdentityProps) => {
	const manager = graph.manager!;
	const window = useWindow();

	const [name, setName] = useState(graph.name)

	const removeGraph = () => {
		manager.removeGraph(graph);
		window?.close();
	};

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value);

	const rename = () => {
		manager.rename(graph, name);

		if (window)
			window.title = name;
	};

	useEffect(() => {
		if(name !== graph.name)
			setName(graph.name)
	},[graph.name])

	return (
		<div className="group">
			<label>Graph name:</label>
			<input value={name} onChange={onChange} onBlur={rename} />
			<button className="btn-delete" onClick={removeGraph}>Delete</button>
		</div>
	);
};
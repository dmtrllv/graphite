import { subscribe } from "@reactive";
import { Bool, F16, F32, I32, U32, Vec2, Vec3, Vec4, WorldGraph, type Graph, type GraphInterfacePort, type Type } from "@editor";
import { useWindow } from "../layout";
import React, { useEffect, useMemo, useState } from "react";
import { NodePropInputs } from "./node-prop-view";

import "./styles/graph-properties.scss"

const types = {
	F16,
	F32,
	U32,
	I32,
	Bool,
	Vec2,
	Vec3,
	Vec4
};

const createType = (name: keyof typeof types): Type => {
	switch (name) {
		case "F16": return new F16(0);
		case "F32": return new F32(0);
		case "U32": return new U32(0);
		case "I32": return new I32(0);
		case "Bool": return new Bool(false);
		case "Vec2": return new Vec2();
		case "Vec3": return new Vec3();
		case "Vec4": return new Vec4();
	}
};

const getTypeName = (type: Type): keyof typeof types => {
	return type.constructor.name as keyof typeof types;
};

type InterfacePortViewProps = {
	graph: Graph;
	direction: "input" | "output";
	port: GraphInterfacePort;
	isInput?: boolean;
};

const InterfacePortView = ({ graph, direction, port, isInput }: InterfacePortViewProps) => {
	const update = (changes: Partial<Pick<GraphInterfacePort, "name" | "type">>) => {
		graph.updateInterfacePort(direction, port.id, changes);
	};

	const Input: React.FC<any> = isInput && NodePropInputs.get(port.type.constructor as any) || (() => <div className="spacing" />);

	const props = {
		value: port.type
	};

	return (
		<div className="graph-interface-port">
			<input className="name" value={port.name} onChange={event => update({ name: event.target.value })} />
			<select value={getTypeName(port.type)} onChange={event => update({ type: createType(event.target.value as keyof typeof types) })}>
				{Object.keys(types).map(type => <option key={type} value={type}>{type}</option>)}
			</select>
			<Input {...props} />
			<button onClick={() => graph.removeInterfacePort(direction, port.id)}>×</button>
		</div>
	);
};

export const GraphProperties = ({ graph, onOpenGraph }: { graph: Graph; onOpenGraph: (graph: Graph) => void; }) => {
	const manager = graph.manager!;
	const [, setGraphVersion] = useState(0);
	const [collapsed, setCollapsed] = useState(false);
	const [catalogVersion, setCatalogVersion] = useState(manager.catalogVersion);

	const isWorldGraph = useMemo(() => graph instanceof WorldGraph, [graph]);

	useEffect(() => {
		const update = () => setGraphVersion(version => version + 1);
		return subscribe(graph, update);
	}, [graph]);

	useEffect(() => {
		if (isWorldGraph)
			return;

		return subscribe(manager, (e) => {
			if (e.key === "catalogVersion")
				setCatalogVersion(manager.catalogVersion);
		});
	}, [manager, isWorldGraph]);

	const availableSubgraphs = isWorldGraph ? manager.getAvailableSubgraphs(graph) : [];

	const window = useWindow();

	const removeGraph = () => {
		graph.manager!.removeGraph(graph);
		window?.close();
	};

	const rename = (event: React.ChangeEvent<HTMLInputElement>) => {
		graph.manager?.rename(graph, event.target.value);
		if (window)
			window.title = event.target.value;
	};

	const toggleCollapse = () => setCollapsed(v => !v);

	const title = isWorldGraph ? "World" : "Graph Properties";

	return (
		<div className={`graph-properties ${collapsed ? "collapsed" : ""}`} data-catalog-version={catalogVersion}>
			<div className="header">
				{title}
				{<button className="btn-collapse" onClick={toggleCollapse}>V</button>}
			</div>
			<div className="content">
				{isWorldGraph ? (
					<div className="subgraphs">
						<div className="title">
							<span>Subgraphs</span>
						</div>
						<div className="group">
							{availableSubgraphs.map(definition => (
								<div key={definition.id} className="subgraph" onClick={() => onOpenGraph(definition)}>
									{definition.name}
								</div>
							))}
						</div>
					</div>
				) : (
					<>
						<div className="group">
							<label>Graph name:</label>
							<input value={graph.name} onChange={rename} />
							{!isWorldGraph && <button className="btn-delete" onClick={removeGraph}>Delete</button>}
						</div>
						<div className="group">
							<div className="title">
								<span>Inputs</span>
								<button onClick={() => graph.addInput(`Input ${graph.inputs.length + 1}`)}>+</button>
							</div>
							{graph.inputs.map(port => <InterfacePortView key={port.id} graph={graph} direction="input" port={port} isInput={true} />)}
						</div>
						<div className="group">
							<div className="title">
								<span>Outputs</span>
								<button onClick={() => graph.addOutput(`Output ${graph.outputs.length + 1}`)}>+</button>
							</div>
							{graph.outputs.map(port => <InterfacePortView key={port.id} graph={graph} direction="output" port={port} />)}
						</div>
					</>
				)}
			</div>
		</div>
	);
};

const WorldGraphProperties = () => {

};

const SubGraphProperties = () => {

};

const SimulationGraphProperties = () => {

};

const PassGraphProperties = () => {

};
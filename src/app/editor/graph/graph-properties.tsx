import { subscribe } from "@reactive";
import { Bool, F16, F32, GraphInterfacePort, I32, U32, Vec2, Vec3, Vec4, WorldGraph, Subgraph, PassGraph, SimulationGraph, type Graph, type Type } from "@editor";
import { useWindow } from "../layout";
import React, { useEffect, useMemo, useState } from "react";
import { NodePropInputs } from "./node-prop-view";

import "./styles/graph-properties.scss";

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

const getTypeName = (type: Type): keyof typeof types => type.constructor.name as keyof typeof types;

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

	return (
		<div className="graph-interface-port">
			<input className="name" value={port.name} onChange={event => update({ name: event.target.value })} />
			<select value={getTypeName(port.type)} onChange={event => update({ type: createType(event.target.value as keyof typeof types) })}>
				{Object.keys(types).map(type => <option key={type} value={type}>{type}</option>)}
			</select>
			<Input value={port.type} />
			<button onClick={() => graph.removeInterfacePort(direction, port.id)}>×</button>
		</div>
	);
};

type DefinitionViewProps = {
	definition: GraphInterfacePort;
	onUpdate: (changes: Partial<Pick<GraphInterfacePort, "name" | "type">>) => void;
	onRemove: () => void;
};

const DefinitionView = ({ definition, onUpdate, onRemove }: DefinitionViewProps) => {
	const Input: React.FC<any> = NodePropInputs.get(definition.type.constructor as any) || (() => <div className="spacing" />);

	return (
		<div className="graph-interface-port">
			<input className="name" value={definition.name} onChange={event => onUpdate({ name: event.target.value })} />
			<select value={getTypeName(definition.type)} onChange={event => onUpdate({ type: createType(event.target.value as keyof typeof types) })}>
				{Object.keys(types).map(type => <option key={type} value={type}>{type}</option>)}
			</select>
			<Input value={definition.type} />
			<button onClick={onRemove}>×</button>
		</div>
	);
};

export const GraphProperties = ({ graph, onOpenGraph }: { graph: Graph; onOpenGraph: (graph: Graph) => void }) => {
	const manager = graph.manager!;
	const [, setGraphVersion] = useState(0);
	const [collapsed, setCollapsed] = useState(false);
	const [catalogVersion, setCatalogVersion] = useState(manager.catalogVersion);
	const isWorldGraph = graph instanceof WorldGraph;
	const isSubgraph = graph instanceof Subgraph;

	useEffect(() => subscribe(graph, () => setGraphVersion(version => version + 1)), [graph]);

	useEffect(() => {
		if (isWorldGraph)
			return;

		return subscribe(manager, event => {
			if (event.key === "catalogVersion")
				setCatalogVersion(manager.catalogVersion);
		});
	}, [manager, isWorldGraph]);

	const availableSubgraphs = isWorldGraph ? manager.getAvailableSubgraphs(graph) : [];
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

	const toggleCollapse = () => setCollapsed(value => !value);

	const addPassOutput = () => {
		if (graph instanceof PassGraph)
			graph.addPassOutput(`Output ${graph.passOutputs.size + 1}`);
	};

	const addSimulationState = () => {
		if (graph instanceof SimulationGraph)
			graph.addState(`State ${graph.states.size + 1}`);
	};

	return (
		<div className={`graph-properties ${collapsed ? "collapsed" : ""}`} data-catalog-version={catalogVersion}>
			<div className="header">
				{isWorldGraph ? "World" : "Graph Properties"}
				<button className="btn-collapse" onClick={toggleCollapse}>V</button>
			</div>
			<div className="content">
				{isWorldGraph && (
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
				)}
				{!isWorldGraph && (
					<div className="group">
						<label>Graph name:</label>
						<input value={graph.name} onChange={rename} />
						<button className="btn-delete" onClick={removeGraph}>Delete</button>
					</div>
				)}
				{isSubgraph && (
					<>
						<div className="group">
							<div className="title">
								<span>Inputs</span>
								<button onClick={() => graph.addInput(`Input ${graph.inputs.length + 1}`)}>+</button>
							</div>
							{graph.inputs.map(port => <InterfacePortView key={port.id} graph={graph} direction="input" port={port} isInput />)}
						</div>
						{(isWorldGraph || isSubgraph) && (
							<div className="group">
								<div className="title">
									<span>Outputs</span>
									<button onClick={() => graph.addOutput(`Output ${graph.outputs.length + 1}`)}>+</button>
								</div>
								{graph.outputs.map(port => <InterfacePortView key={port.id} graph={graph} direction="output" port={port} />)}
							</div>
						)}
					</>
				)}
				{graph instanceof PassGraph && (
					<div className="group">
						<div className="title">
							<span>Pass Outputs</span>
							<button onClick={addPassOutput}>+</button>
						</div>
						{[...graph.passOutputs.values()].map(definition => (
							<DefinitionView key={definition.id} definition={definition}
								onUpdate={changes => graph.updatePassOutput(definition.id, changes)}
								onRemove={() => graph.removePassOutput(definition.id)} />
						))}
					</div>
				)}
				{graph instanceof SimulationGraph && (
					<div className="group">
						<div className="title">
							<span>Simulation States</span>
							<button onClick={addSimulationState}>+</button>
						</div>
						{[...graph.states.values()].map(definition => (
							<DefinitionView key={definition.id} definition={definition}
								onUpdate={changes => graph.updateState(definition.id, changes)}
								onRemove={() => graph.removeState(definition.id)} />
						))}
					</div>
				)}
			</div>
		</div>
	);
};

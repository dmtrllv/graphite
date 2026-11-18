import { useObservable } from "../../reactive";
import { Bool, F16, F32, I32, U32, Vec2, Vec3, Vec4, type Graph, type GraphInterfacePort, type Type } from "../../graph";

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

const InterfacePortView = ({ graph, direction, port }: {
	graph: Graph;
	direction: "input" | "output";
	port: GraphInterfacePort;
}) => {
	const update = (changes: Partial<Pick<GraphInterfacePort, "name" | "type">>) => {
		try {
			graph.updateInterfacePort(direction, port.id, changes);
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div className="graph-interface-port">
			<input value={port.name} onChange={event => update({ name: event.target.value })} />
			<select value={getTypeName(port.type)} onChange={event => update({ type: createType(event.target.value as keyof typeof types) })}>
				{Object.keys(types).map(type => <option key={type} value={type}>{type}</option>)}
			</select>
			<button onClick={() => graph.removeInterfacePort(direction, port.id)}>×</button>
		</div>
	);
};

export const GraphProperties = ({ graph }: { graph: Graph }) => {
	useObservable(graph, { recursive: true });

	return (
		<div className="graph-properties">
			<div className="graph-properties-header">{graph.isWorldGraph && "World "}Graph Properties</div>
			{!graph.isWorldGraph && (
				<>
					<div className="graph-properties-section">
						<input value={graph.name} onChange={event => graph.manager?.rename(graph, event.target.value)} />
					</div>
					<div className="graph-properties-group">
						<div className="graph-properties-title">
							<span>Inputs</span>
							<button onClick={() => graph.addInput(`Input ${graph.inputs.length + 1}`)}>+</button>
						</div>
						{graph.inputs.map(port => <InterfacePortView key={port.id} graph={graph} direction="input" port={port} />)}
					</div>
					<div className="graph-properties-group">
						<div className="graph-properties-title">
							<span>Outputs</span>
							<button onClick={() => graph.addOutput(`Output ${graph.outputs.length + 1}`)}>+</button>
						</div>
						{graph.outputs.map(port => <InterfacePortView key={port.id} graph={graph} direction="output" port={port} />)}
					</div>
				</>
			)}
		</div>
	);
};
import type { Subgraph, GraphInterfacePort, Type } from "@editor";
import { GraphPropertyType } from "./property-type";

type GraphInterfaceProps = {
	graph: Subgraph;
};

type InterfacePortProps = {
	graph: Subgraph;
	direction: "input" | "output";
	port: GraphInterfacePort;
};

const InterfacePort = ({ graph, direction, port }: InterfacePortProps) => {
	const update = (changes: Partial<Pick<GraphInterfacePort, "name" | "type">>) => {
		graph.updateInterfacePort(direction, port.id, changes);
	};

	return (
		<div className="graph-interface-port">
			<input className="name" value={port.name} onChange={event => update({ name: event.target.value })} />
			<GraphPropertyType type={port.type} onChange={(type: Type) => update({ type })} />
			<button onClick={() => graph.removeInterfacePort(direction, port.id)}>&times;</button>
		</div>
	);
};

export const GraphInterface = ({ graph }: GraphInterfaceProps) => (
	<>
		<div className="group">
			<div className="title">
				<span>Inputs</span>
				<button onClick={() => graph.addInput(`Input ${graph.inputs.length + 1}`)}>+</button>
			</div>
			{graph.inputs.map(port => <InterfacePort key={port.id} graph={graph} direction="input" port={port} />)}
		</div>
		<div className="group">
			<div className="title">
				<span>Outputs</span>
				<button onClick={() => graph.addOutput(`Output ${graph.outputs.length + 1}`)}>+</button>
			</div>
			{graph.outputs.map(port => <InterfacePort key={port.id} graph={graph} direction="output" port={port} />)}
		</div>
	</>
);
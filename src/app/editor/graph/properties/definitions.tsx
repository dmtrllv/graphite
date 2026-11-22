import type { GraphInterfacePort, Type, PassGraph, SimulationGraph } from "@editor";
import { GraphPropertyType } from "./property-type";

type GraphDefinitionsProps = {
	graph: PassGraph | SimulationGraph;
};

type DefinitionProps = {
	definition: GraphInterfacePort;
	onUpdate: (changes: Partial<Pick<GraphInterfacePort, "name" | "type">>) => void;
	onRemove: () => void;
};

const Definition = ({ definition, onUpdate, onRemove }: DefinitionProps) => (
	<div className="graph-interface-port">
		<input className="name" value={definition.name} onChange={event => onUpdate({ name: event.target.value })} />
		<GraphPropertyType type={definition.type} onChange={(type: Type) => onUpdate({ type })} />
		<button onClick={onRemove}>&times;</button>
	</div>
);

export const GraphDefinitions = ({ graph }: GraphDefinitionsProps) => {
	if ("passOutputs" in graph) {
		return (
			<div className="group">
				<div className="title">
					<span>Pass Outputs</span>
					<button onClick={() => graph.addPassOutput(`Output ${graph.passOutputs.size + 1}`)}>+</button>
				</div>
				{[...graph.passOutputs.values()].map(definition => (
					<Definition key={definition.id} definition={definition}
						onUpdate={changes => graph.updatePassOutput(definition.id, changes)}
						onRemove={() => graph.removePassOutput(definition.id)} />
				))}
			</div>
		);
	}

	return (
		<div className="group">
			<div className="title">
				<span>Simulation States</span>
				<button onClick={() => graph.addState(`State ${graph.states.size + 1}`)}>+</button>
			</div>
			{[...graph.states.values()].map(definition => (
				<Definition key={definition.id} definition={definition}
					onUpdate={changes => graph.updateState(definition.id, changes)}
					onRemove={() => graph.removeState(definition.id)} />
			))}
		</div>
	);
};
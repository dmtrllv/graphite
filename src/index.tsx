import { BinaryOp, BinaryOpNode, GraphManager, SubGraph, SubGraphNode, UnaryOp, UnaryOpNode, ValueNode, SimulationGroup } from "./compiler/graph";

const manager = new GraphManager();

const subGraph = manager.createGraph(SubGraph, "Test");

const subGraph2 = manager.tryCreateGraph(SubGraph, "Test");
if (subGraph2.isErr()) {
	console.error(subGraph2.error.toString());
}

const a = manager.addNode(subGraph, ValueNode, { value: 0 });
const b = manager.addNode(subGraph, ValueNode, { value: 1 });

const add = manager.addNode(subGraph, BinaryOpNode, { op: BinaryOp.add });

subGraph.connect(a, "value", add, "a");
subGraph.connect(b, "value", add, "b");

const negate = manager.addNode(subGraph, UnaryOpNode, { op: UnaryOp.negate });

subGraph.connect(add, "value", negate, "a");

// Create nested groups.
const groupA = subGraph.addGroup(SimulationGroup, "Simulation");
const groupB = subGraph.addGroup(SimulationGroup, "Nested Simulation", groupA);

// Transfer nodes into groups.
subGraph.transferNode(a, groupA);
subGraph.transferNode(b, groupA);
subGraph.transferNode(add, groupB);
subGraph.transferNode(negate, groupB);

// Add a subgraph node to the world graph.
manager.worldGraph.addNode(SubGraphNode, { graph: subGraph.id });

const serialized = manager.serialize();

const testManager = new GraphManager(serialized);
const serialized2 = testManager.serialize();

const s1 = JSON.stringify(serialized, null, 4);
const s2 = JSON.stringify(serialized2, null, 4);

console.log(s1);
console.log(s2);
console.log("Serialization round-trip:", s1 === s2);
import { BinaryOp, BinaryOpNode, GraphManager, SimulationGroup, SubGraph, SubGraphNode, UnaryOp, UnaryOpNode, ValueNode } from "./compiler/graph";
import { PassGraph } from "./compiler/graph/pass";
import { PassNode } from "./compiler/graph/nodes/pass";
import { ValueType, Vec3 } from "./compiler/types";

const manager = new GraphManager();
const world = manager.worldGraph;

const subGraph = manager.createGraph(SubGraph, "Reusable", {});
const nestedSubGraph = manager.createGraph(SubGraph, "Nested", {});

manager.addNode(nestedSubGraph, ValueNode, { value: 42 });
manager.addNode(subGraph, SubGraphNode, { graph: nestedSubGraph.id });

const a = manager.addNode(subGraph, ValueNode, { value: 10 });
const b = manager.addNode(subGraph, ValueNode, { value: 5 });
const add = manager.addNode(subGraph, BinaryOpNode, { op: BinaryOp.add });
const negate = manager.addNode(subGraph, UnaryOpNode, { op: UnaryOp.negate });

manager.connect(subGraph, a, "value", add, "a");
manager.connect(subGraph, b, "value", add, "b");
manager.connect(subGraph, add, "value", negate, "a");

const groupA = subGraph.addGroup(SimulationGroup, "Simulation");
const groupB = subGraph.addGroup(SimulationGroup, "Nested Simulation", groupA);

subGraph.transferNode(negate, groupB);
subGraph.transferNode(add, groupB);
subGraph.transferNode(a, groupA);
subGraph.transferNode(b, groupA);

const heightPass = manager.createGraph(PassGraph, "Height", { inputs: {}, outputs: {} });

const normalPass = manager.createGraph(PassGraph, "Normals", { inputs: {}, outputs: {} });

heightPass.setPassInput("seed", ValueType);
heightPass.setPassOutput("height", ValueType);

normalPass.setPassInput("height", ValueType);
normalPass.setPassOutput("normal", Vec3);

const heightA = manager.addNode(heightPass, ValueNode, { value: 1 });
const heightB = manager.addNode(heightPass, ValueNode, { value: 2 });
const heightAdd = manager.addNode(heightPass, BinaryOpNode, { op: BinaryOp.add });

manager.connect(heightPass, heightA, "value", heightAdd, "a");
manager.connect(heightPass, heightB, "value", heightAdd, "b");

const normalValue = manager.addNode(normalPass, ValueNode, { value: 1 });
const normalNegate = manager.addNode(normalPass, UnaryOpNode, { op: UnaryOp.negate });

manager.connect(normalPass, normalValue, "value", normalNegate, "a");

const heightNode = manager.addNode(world, PassNode, { graphId: heightPass.id });
const normalNode = manager.addNode(world, PassNode, { graphId: normalPass.id });

manager.connect(world, heightNode, "height", normalNode, "height");

manager.addNode(world, SubGraphNode, { graph: subGraph.id });

world.setOutput("normal", Vec3);

const serialized = manager.serialize();
const restoredManager = new GraphManager(serialized);
const serializedAgain = restoredManager.serialize();

const restoredHeightPass = restoredManager.getGraph(heightPass.id, PassGraph);
const restoredWorld = restoredManager.worldGraph;

const structureRoundTrip = JSON.stringify(serialized) === JSON.stringify(serializedAgain);

const passIORoundTrip =
	JSON.stringify(heightPass.inputs) === JSON.stringify(restoredHeightPass.inputs) &&
	JSON.stringify(heightPass.outputs) === JSON.stringify(restoredHeightPass.outputs);

const worldIORoundTrip = JSON.stringify(world.outputs) === JSON.stringify(restoredWorld.outputs);

console.log("Graph structure round-trip:", structureRoundTrip);
console.log("Pass IO round-trip:", passIORoundTrip);
console.log("World IO round-trip:", worldIORoundTrip);

console.log("Graphs:", manager.getGraphs(SubGraph).length, manager.getGraphs(PassGraph).length);
console.log("World nodes:", world.nodes);
console.log("World edges:", world.edges);
console.log("Subgraph groups:", subGraph.groups);
console.log("Simulation group A:", groupA.nodes);
console.log("Simulation group B:", groupB.nodes);
console.log("Height pass IO:", heightPass.inputs, heightPass.outputs);
console.log("Normal pass IO:", normalPass.inputs, normalPass.outputs);
console.log("World outputs:", world.outputs);

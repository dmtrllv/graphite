import { BinaryOp, BinaryOpNode, GraphManager, SimulationGroup, SubGraph, SubGraphNode, UnaryOp, UnaryOpNode, ValueNode } from "./compiler/graph";
import { PassGraph } from "./compiler/graph/pass";
import { PassNode } from "./compiler/graph/nodes/pass";
import { ValueType, Vec3 } from "./compiler/types";
import { Compiler } from "./compiler";

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

const groupA = subGraph.addGroup(SimulationGroup, "Simulation", { iterationCount: 1000 }, {  });
const groupB = subGraph.addGroup(SimulationGroup, "Nested Simulation", { iterationCount: 1000 }, {}, groupA);

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

const compiler = new Compiler(manager);

console.log(JSON.stringify(await compiler.compile(), null, 4));
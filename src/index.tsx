
import { BinaryOp, BinaryOpNode, GraphManager, PassNode, UnaryOp, UnaryOpNode, ValueNode } from "./compiler/graph";
import { PassGraph } from "./compiler/graph/pass";
import { Vec3, ValueType } from "./compiler/types";
import { Compiler } from "./compiler";

const manager = new GraphManager();
const world = manager.worldGraph;

const heightPass = manager.createGraph(PassGraph, "Height", { inputs: {}, outputs: {} });
heightPass.setPassOutput("height", ValueType);

const heightA = manager.addNode(heightPass, ValueNode, { value: 1 });
const heightB = manager.addNode(heightPass, ValueNode, { value: 2 });
const heightAdd = manager.addNode(heightPass, BinaryOpNode, { op: BinaryOp.add });

manager.connect(heightPass, heightA, "value", heightAdd, "a");
manager.connect(heightPass, heightB, "value", heightAdd, "b");

const normalPass = manager.createGraph(PassGraph, "Normals", { inputs: {}, outputs: {} });
normalPass.setPassInput("height", ValueType);
normalPass.setPassOutput("normal", Vec3);

const normalValue = manager.addNode(normalPass, ValueNode, { value: 1 });
const normalNegate = manager.addNode(normalPass, UnaryOpNode, { op: UnaryOp.negate });

manager.connect(normalPass, normalValue, "value", normalNegate, "a");

const heightNode = manager.addNode(world, PassNode, { graphId: heightPass.id });
const normalNode = manager.addNode(world, PassNode, { graphId: normalPass.id });

manager.connect(world, heightNode, "height", normalNode, "height");

world.setPassOutput("normal", Vec3);

manager.connect(world, heightNode, "height", world.outputNode, "elevation");
manager.connect(world, normalNode, "normal", world.outputNode, "normal");

const compiler = new Compiler(manager);
const compilation = await compiler.compile();

console.log(JSON.stringify(compilation, null, 4));

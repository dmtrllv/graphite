import { BinaryOp, BinaryOpNode, GraphManager, SubGraph, UnaryOp, UnaryOpNode, ValueNode } from "./compiler/graph";

const manager = new GraphManager();

const subGraph = manager.createGraph(SubGraph, "Test");

const a = manager.addNode(subGraph, ValueNode, { value: 0 });
const b = manager.addNode(subGraph, ValueNode, { value: 1 });

const add = manager.addNode(subGraph, BinaryOpNode, { op: BinaryOp.add });

manager.connect(subGraph, a, "value", add, "a");
manager.connect(subGraph, b, "value", add, "b");

const negate = manager.addNode(subGraph, UnaryOpNode, { op: UnaryOp.negate });

manager.connect(subGraph, add, "value", negate, "a");

const serialized = manager.serialize();

console.log();

const testManager = new GraphManager(serialized);
const serialized2 = testManager.serialize();
const s1 = JSON.stringify(serialized, null, 4);
const s2 = JSON.stringify(serialized2, null, 4);

console.log(s1 === s2);

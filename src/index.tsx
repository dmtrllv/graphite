import { GraphManager } from "./compiler/graph/graph-manager";
import { SubGraphNode } from "./compiler/graph/nodes";
import { BinaryOp, BinaryOpNode, UnaryOp, UnaryOpNode } from "./compiler/graph/nodes/math";
import { ValueNode } from "./compiler/graph/nodes/value";
import { SubGraph } from "./compiler/graph/subgraph";

const graphs = new GraphManager();

const subGraph = graphs.createGraph(SubGraph, "Test");

const a = subGraph.addNode(ValueNode, 0);
const b = subGraph.addNode(ValueNode, 1);

const add = subGraph.addNode(BinaryOpNode, BinaryOp.add);

subGraph.connect(a, "value", add, "a");
subGraph.connect(b, "value", add, "b");
subGraph.connect(b, "value", add, "b");

const negate = subGraph.addNode(UnaryOpNode, UnaryOp.negate);

subGraph.connect(add, "value", negate, "a");

const test = graphs.worldGraph.addNode(SubGraphNode, subGraph);



console.log(graphs.worldGraph);
import { App } from "./graphite";
import { BinOp, BinOpNode, ValueNode } from "./graphite/nodes";
import { ValueType } from "./graphite/types";

const app = await App.init();

const createMullAdd = () => {
	const graph = app.createSubGraph("Mul Add", {
		inputs: {
			a: ValueType,
			b: ValueType,
			c: ValueType,
		},
		outputs: {
			result: ValueType,
		}
	});

	const mul = graph.addNode(BinOpNode, { a: 0, b: 0, op: BinOp.mul });
	const add = graph.addNode(BinOpNode, { a: 0, b: 0, op: BinOp.add });

	mul.outputs.value.connect(add.inputs.a);

	add.outputs.value.connect(graph.outputNode.inputs.result);

	graph.addInputNode("a").outputs.value.connect(mul.inputs.a);
	graph.addInputNode("b").outputs.value.connect(mul.inputs.b);
	graph.addInputNode("c").outputs.value.connect(add.inputs.b);
	return graph;
};

const createMullAddDynamic = () => {
	const graph = app.createSubGraph("Mul Add Dynamic");
	graph.setInput("a", ValueType);
	graph.setInput("b", ValueType);
	graph.setInput("c", ValueType);
	graph.setOutput("result", ValueType);

	const mul = graph.addNode(BinOpNode, { a: 0, b: 0, op: BinOp.mul });
	const add = graph.addNode(BinOpNode, { a: 0, b: 0, op: BinOp.add });

	mul.outputs.value.connect(add.inputs.a);
	const x = graph.outputNode.getInput("result", ValueType);
	add.outputs.value.connect(x);

	graph.addInputNode("a").outputs.value.connect(mul.inputs.a);
	graph.addInputNode("b").outputs.value.connect(mul.inputs.b);
	graph.addInputNode("c").outputs.value.connect(add.inputs.b);
	return graph;
}

const mulAddGraph = createMullAdd();
const mulAddGraphDynamic = createMullAddDynamic();

const mulAdd = app.world.addGraphNode(mulAddGraph);

const a = app.world.addNode(ValueNode, { value: 3 });
const b = app.world.addNode(ValueNode, { value: 11 });
const c = app.world.addNode(ValueNode, { value: 29 });

a.outputs.value.connect(mulAdd.inputs.a);
b.outputs.value.connect(mulAdd.inputs.b);
c.outputs.value.connect(mulAdd.inputs.c);

mulAdd.outputs.result.connect(app.world.outputNode.inputs.elevation);
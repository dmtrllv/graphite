import { App } from "./graphite";
import { BinOp, BinOpNode } from "./graphite/nodes";
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
}

const mulAddGraph = createMullAdd();

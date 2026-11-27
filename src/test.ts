import { Graphite } from "./graphite";
import { BinOp, BinOpNode, ValueNode } from "./graphite/nodes";
import { ValueType } from "./graphite/types";

export const createTestApp = (app: Graphite) => {
	const mulAddGraph = app.createSubGraph("Mul Add", {
		inputs: {
			a: ValueType,
			b: ValueType,
			c: ValueType,
		},
		outputs: {
			result: ValueType,
		}
	});

	const mul = mulAddGraph.addNode(BinOpNode, { a: 0, b: 0, op: BinOp.mul });
	const add = mulAddGraph.addNode(BinOpNode, { op: BinOp.add });

	mul.outputs.value.connect(add.inputs.a);

	add.outputs.value.connect(mulAddGraph.outputNode.inputs.result);

	mulAddGraph.addInputNode("a").outputs.value.connect(mul.inputs.a);
	mulAddGraph.addInputNode("b").outputs.value.connect(mul.inputs.b);
	mulAddGraph.addInputNode("c").outputs.value.connect(add.inputs.b);

	const mulAdd = app.world.addGraphNode(mulAddGraph, { a: 0, b: 0, c: 0 }, [350, 200]);

	const a = app.world.addNode(ValueNode, { value: 3 }, [120, 100]);
	const b = app.world.addNode(ValueNode, { value: 11 }, [120, 200]);
	const c = app.world.addNode(ValueNode, { value: 29 }, [120, 300]);

	a.outputs.value.connect(mulAdd.getInput("a", ValueType));
	b.outputs.value.connect(mulAdd.getInput("b", ValueType));
	c.outputs.value.connect(mulAdd.getInput("c", ValueType));

	mulAdd.getOutput("result", ValueType).connect(app.world.outputNode.inputs.elevation);

	app.world.outputNode.position = [500, 200]
};

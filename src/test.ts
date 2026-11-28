import { Graphite } from "./graphite";
import { BinOp, BinOpNode, ValueNode, VectorCombine } from "./graphite/nodes";
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

	mul.outputPorts.value.connect(add.inputPorts.a);

	add.outputPorts.value.connect(mulAddGraph.outputNode.inputPorts.result);

	mulAddGraph.addInputNode("a").outputPorts.value.connect(mul.inputPorts.a);
	mulAddGraph.addInputNode("b").outputPorts.value.connect(mul.inputPorts.b);
	mulAddGraph.addInputNode("c").outputPorts.value.connect(add.inputPorts.b);

	const mulAdd = app.world.addGraphNode(mulAddGraph, { a: 0, b: 0, c: 0 }, [350, 200]);

	const a = app.world.addNode(ValueNode, { value: 3 }, [120, 100]);
	const b = app.world.addNode(ValueNode, { value: 11 }, [120, 200]);
	const c = app.world.addNode(ValueNode, { value: 29 }, [120, 300]);

	a.outputPorts.value.connect(mulAdd.getInputPort("a", ValueType));
	b.outputPorts.value.connect(mulAdd.getInputPort("b", ValueType));
	c.outputPorts.value.connect(mulAdd.getInputPort("c", ValueType));

	mulAdd.getOutputPort("result", ValueType).connect(app.world.outputNode.inputPorts.elevation);

	app.world.outputNode.position = [500, 200];

	app.world.addNode(VectorCombine, {});
	app.world.addNode(BinOpNode, {
		op: BinOp.add
	});
};

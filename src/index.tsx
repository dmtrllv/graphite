import { BinaryOp, BinaryOpNode, GraphInputNode, GraphManager, PassBufferSampler, PassNode, ValueNode, Vector3Node } from "./compiler/graph";
import { PassGraph } from "./compiler/graph/pass";
import { createPassBufferRef, Vec3, ValueType } from "./compiler/types";
import { Runtime } from "./compiler";
import { isAborted } from "./utils";

const manager = new GraphManager();
const world = manager.worldGraph;

world.setPassOutput("normal", Vec3);

const heightPass = manager.createGraph(PassGraph, "Height", { inputs: {}, outputs: {} });
heightPass.setPassOutput("height", ValueType);

const heightA = manager.addNode(heightPass, ValueNode, { value: 1 });
const heightB = manager.addNode(heightPass, ValueNode, { value: 2 });
const heightAdd = manager.addNode(heightPass, BinaryOpNode, { op: BinaryOp.add });

manager.connect(heightPass, heightA, "value", heightAdd, "a");
manager.connect(heightPass, heightB, "value", heightAdd, "b");
manager.connect(heightPass, heightAdd, "value", heightPass.outputNode, "height");

const normalPass = manager.createGraph(PassGraph, "Normals", { inputs: {}, outputs: {} });
normalPass.setPassInput("height", createPassBufferRef(heightPass.id, "height"));
normalPass.setPassOutput("normal", Vec3);

const heightInput = manager.addNode(normalPass, GraphInputNode, {
	graphId: normalPass.id,
	inputName: "height"
});
const heightSampler = manager.addNode(normalPass, PassBufferSampler, {});

manager.connect(normalPass, heightInput, "value", heightSampler, "buffer");

const normalY = manager.addNode(normalPass, ValueNode, { value: -1 });
const normalZ = manager.addNode(normalPass, ValueNode, { value: -1 });
const normalVector = manager.addNode(normalPass, Vector3Node, {});

manager.connect(normalPass, heightSampler, "value", normalVector, "x");
manager.connect(normalPass, normalY, "value", normalVector, "y");
manager.connect(normalPass, normalZ, "value", normalVector, "z");
manager.connect(normalPass, normalVector, "value", normalPass.outputNode, "normal");

const heightNode = manager.addNode(world, PassNode, { graphId: heightPass.id });
const normalNode = manager.addNode(world, PassNode, { graphId: normalPass.id });

manager.connect(world, heightNode, "height", normalNode, "height");

const worldHeightSampler = manager.addNode(world, PassBufferSampler, {});
const normalSampler = manager.addNode(world, PassBufferSampler, {});

manager.connect(world, heightNode, "height", worldHeightSampler, "buffer");
manager.connect(world, worldHeightSampler, "value", world.outputNode, "elevation");

manager.connect(world, normalNode, "normal", normalSampler, "buffer");
manager.connect(world, normalSampler, "value", world.outputNode, "normal");

const runtime = await Runtime.init(manager);

const chunk = await runtime.resolveChunk(0, 0);

if (!isAborted(chunk)) {
	const buffers = await Promise.all(Object.values(chunk.buffers).map(b => runtime.readBuffer(b)));
	buffers.forEach(buffer => {
		console.log(new Float32Array(buffer));
	});
}
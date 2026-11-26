import { assert } from "@utils";
import { GraphInputNode, GraphOutputNode } from "./graph";
import { MathNodes } from "./math";
import { PassNode } from "./pass";
import { PassBufferSampler } from "./pass-sampler";
import { SimulationInputNode, SimulationOutputNode } from "./simulation";
import { SubGraphNode } from "./subgraph";
import { ValueNode } from "./value";
import { TextureSampler } from "./texture-sampler";
import { GroupInputNode, GroupOutputNode } from "./group";
import { Vector2Node, Vector3Node, Vector4Node } from "./vector";

export const DEFAULT_NODES = [
	...MathNodes,
	ValueNode,
	SubGraphNode,
	GraphInputNode,
	TextureSampler,
	Vector2Node,
	Vector3Node,
	Vector4Node,
];

export const ALL_NODES = [
	...DEFAULT_NODES,
	GraphOutputNode,
	GroupInputNode,
	GroupOutputNode,
	SimulationInputNode,
	SimulationOutputNode,
	PassNode,
	PassBufferSampler,
];

export const getNodeType = (type: string): (typeof ALL_NODES)[number] => {
	return assert.notNull(ALL_NODES.find(n => n.name === type));
};
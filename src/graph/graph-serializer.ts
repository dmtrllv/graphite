import { Graph, NodeEdge } from "./graph";
import { GraphManager } from "./graph-manager";
import { GraphNode, NodeOption } from "./nodes";
import { F16, F32, U32, I32, Bool, Scalar, Vec2, Vec3, Vec4, Matrix, Type, type TypeCtor } from "./types";

interface SerializedScalar {
	type: "F16" | "F32" | "U32" | "I32" | "Bool";
	value: boolean | number;
}

interface SerializedVec2 {
	type: "Vec2";
	x: number;
	y: number;
}

interface SerializedVec3 {
	type: "Vec3";
	x: number;
	y: number;
	z: number;
}

interface SerializedVec4 {
	type: "Vec4";
	x: number;
	y: number;
	z: number;
	w: number;
}

interface SerializedMatrix {
	type: "Matrix";
	scalar: SerializedScalar["type"];
	rows: number;
	columns: number;
}

type SerializedType = SerializedScalar | SerializedVec2 | SerializedVec3 | SerializedVec4 | SerializedMatrix;

interface SerializedNode {
	id: number;
	type: string;
	position: [number, number];
	values: Record<string, SerializedType>;
	options: Record<string, string>;
}

interface SerializedEdge {
	id: number;
	source: number;
	sourceOutput: string;
	target: number;
	targetInput: string;
}

interface SerializedGraph {
	id: number;
	name: string;
	offset: [number, number];
	scale: number;
	nodes: SerializedNode[];
	edges: SerializedEdge[];
}

export interface SerializedGraphManager {
	graphs: SerializedGraph[];
}

const scalarTypes: Record<SerializedScalar["type"], new (value: any) => Scalar<number | boolean>> = {
	F16,
	F32,
	U32,
	I32,
	Bool
};

const serializeType = (value: Type): SerializedType => {
	if (value instanceof Scalar)
		return { type: value.constructor.name as SerializedScalar["type"], value: value.value };

	if (value instanceof Vec2)
		return { type: "Vec2", x: value.x, y: value.y };

	if (value instanceof Vec3)
		return { type: "Vec3", x: value.x, y: value.y, z: value.z };

	if (value instanceof Vec4)
		return { type: "Vec4", x: value.x, y: value.y, z: value.z, w: value.w };

	if (value instanceof Matrix)
		return { type: "Matrix", scalar: value.type.name as SerializedScalar["type"], rows: value.rows, columns: value.columns };

	throw new Error(`Unsupported serializable type '${value.constructor.name}'.`);
};

const deserializeType = (value: SerializedType): Type => {
	switch (value.type) {
		case "F16":
		case "F32":
		case "U32":
		case "I32":
		case "Bool":
			return new scalarTypes[value.type]!(value.value);

		case "Vec2":
			return new Vec2(value.x, value.y);

		case "Vec3":
			return new Vec3(value.x, value.y, value.z);

		case "Vec4":
			return new Vec4(value.x, value.y, value.z, value.w);

		case "Matrix": {
			const scalar = scalarTypes[value.scalar];

			if (!scalar)
				throw new Error(`Unknown matrix scalar type '${value.scalar}'.`);

			return new Matrix(scalar as TypeCtor<Scalar>, value.rows, value.columns);
		}

		default:
			throw new Error(`Unsupported serialized type '${(value as { type: string }).type}'.`);
	}
};

const serializeNode = (node: GraphNode): SerializedNode => {
	const type = node.constructor as typeof GraphNode;
	const inputs = GraphNode.getInputs(type);
	const outputs = GraphNode.getOutputs(type);
	const options = GraphNode.getOptions(type);

	const values: Record<string, SerializedType> = {};
	const serializedOptions: Record<string, string> = {};

	for (const name of [...Object.keys(inputs), ...Object.keys(outputs)]) {
		const value = (node as any)[name];

		if (!(value instanceof Type))
			throw new Error(`Node property '${name}' is not a Type.`);

		values[name] = serializeType(value);
	}

	for (const name of Object.keys(options)) {
		const option = (node as any)[name];

		if (!(option instanceof NodeOption))
			throw new Error(`Node option '${name}' is not a NodeOption.`);

		serializedOptions[name] = option.value;
	}

	return {
		id: node.id,
		type: node.name,
		position: [node.position.x, node.position.y],
		values,
		options: serializedOptions
	};
};

const deserializeNode = (graph: Graph, json: SerializedNode): GraphNode => {
	const type = GraphNode.getRegisteredNodes().get(json.type);

	if (!type)
		throw new Error(`Unknown node type '${json.type}'.`);

	const node = new type(json.id, graph, new Vec2(...json.position));

	graph.restoreNode(node);

	const inputs = GraphNode.getInputs(type);
	const outputs = GraphNode.getOutputs(type);
	const options = GraphNode.getOptions(type);

	for (const [name, value] of Object.entries(json.values)) {
		if (!(name in inputs) && !(name in outputs))
			throw new Error(`Unknown node property '${name}' on '${json.type}'.`);

		(node as any)[name] = deserializeType(value);
	}

	for (const [name, value] of Object.entries(json.options)) {
		if (!(name in options))
			throw new Error(`Unknown node option '${name}' on '${json.type}'.`);

		const option = (node as any)[name];

		if (!(option instanceof NodeOption))
			throw new Error(`Node option '${name}' is not a NodeOption.`);

		option.value = value;
	}

	return node;
};

const serializeGraph = (graph: Graph): SerializedGraph => {
	return {
		id: graph.id,
		name: graph.name,
		offset: [graph.offset.x, graph.offset.y],
		scale: graph.scale,
		nodes: [...graph.nodes.values()].map(serializeNode),
		edges: [...graph.edges.values()].map(edge => ({
			id: edge.id,
			source: edge.source.id,
			sourceOutput: edge.sourceOutput,
			target: edge.target.id,
			targetInput: edge.targetInput
		}))
	};
};

const deserializeGraph = (json: SerializedGraph): Graph => {
	const graph = new Graph(json.id, json.name, new Vec2(...json.offset));
	graph.scale = json.scale;

	const nodes = new Map<number, GraphNode>();

	for (const nodeJson of json.nodes) {
		const node = deserializeNode(graph, nodeJson);
		nodes.set(node.id, node);
	}

	for (const edgeJson of json.edges) {
		const source = nodes.get(edgeJson.source);
		const target = nodes.get(edgeJson.target);

		if (!source || !target)
			throw new Error(`Edge ${edgeJson.id} references a missing node.`);

		graph.restoreEdge(new NodeEdge(
			edgeJson.id,
			source,
			edgeJson.sourceOutput,
			target,
			edgeJson.targetInput
		));
	}

	return graph;
};

export const serializeGraphManager = (manager: GraphManager): SerializedGraphManager => {
	return {
		graphs: [...manager.graphs.values()].map(serializeGraph)
	};
};

export const deserializeGraphManager = (json: SerializedGraphManager): GraphManager => {
	const manager = new GraphManager();

	for (const graphJson of json.graphs)
		manager.restore(deserializeGraph(graphJson));

	return manager;
};

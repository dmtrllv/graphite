import { Allocator, assert, Err, Ok, Result } from "@utils";
import { Node, type NodeType } from "./nodes/node";
import type { Type } from "../types";
import { getNodeType, GraphOutputNode, type NodeOutputName, type NodeProps } from "./nodes";
import { GraphError } from "./error";
import type { MatchingNodeInputPortNames } from "./graph-manager";
import { Group } from "./group";
import { getGroupType } from "./group_types";

export abstract class Graph {
	public readonly id: number;

	protected readonly _nodes: Allocator<Node>;
	protected readonly _edges: Allocator<Edge>;
	protected readonly _groups: Allocator<Group>;

	public get nodes(): GraphNodeType<this>[] {
		return this._nodes.all() as GraphNodeType<this>[];
	}

	public get edges(): Edge[] {
		return this._edges.all();
	}

	public get groups(): Group[] {
		return this._groups.all();
	}

	protected get outputNodeType(): NodeType<GraphOutputNode, any> {
		return GraphOutputNode;
	}

	public get outputNode() {
		const node = assert.notNull(this.getNode(0));
		assert(() => node instanceof this.outputNodeType, `First node is not a ${this.outputNodeType.name}!`);
		return node;
	}

	public get inputs(): GraphIO {
		return {};
	}

	public get outputs(): GraphIO {
		return {};
	}

	public name: string;

	public abstract get nodeTypes(): NodeType<any, any>[];

	public constructor(id: number, name: string, nodes: Node[] = [], edges: Edge[] = [], groups: Group[] = []) {
		this.id = id;
		this.name = name;
		this._nodes = new Allocator(Node);
		this._edges = new Allocator(Edge);
		this._groups = new Allocator(Group);
		nodes.forEach(node => this._nodes.allocAt(node.id, getNodeType(node.type), node.id, this.id, node.props as any));
		edges.forEach(edge => this._edges.allocWithId(Edge, edge));
		groups.forEach(group =>this._groups.allocAt(group.id, getGroupType(group.type), group.id, group.nodes, group.groups));
		if(!this._nodes.get(0))
			this._nodes.allocWithId(this.outputNodeType, this.id, { graphId: id });
	}

	public getNode(id: number): Node | undefined;
	public getNode<T extends Node>(id: number, type: NodeType<T, any>): T | undefined;
	public getNode(id: number): Node | undefined {
		return this._nodes.get(id);
	}

	public getEdge(id: number): Edge | undefined {
		return this._edges.get(id);
	}

	public addNode<T extends GraphNodeType<this>, P extends NodeProps<T>>(type: NodeType<T, P>, props: P): T {
		return this._nodes.allocWithId(type, this.id, props);
	}

	public tryAddNode<T extends Node<Props>, Props extends {}>(type: NodeType<T, Props>, props: Props): Result<T, GraphError> {
		if (!this.nodeTypes.includes(type))
			return Err(GraphError.InvalidNodeType(this, type));
		return Ok(this._nodes.allocWithId(type, this.id, props));
	}

	public removeNode(node: GraphNodeType<this>) {
		for (const edge of this.edges)
			if (edge.source === node.id || edge.target === node.id)
				this._edges.free(edge.id);

		this._nodes.free(node.id);
	}

	public connect<Source extends GraphNodeType<this>, K extends NodeOutputName<Source>, Target extends GraphNodeType<this>>(source: Source, outputPort: K, target: Target, inputPort: MatchingNodeInputPortNames<Target, Source, K>): Edge {
		assert(() => source.graphId === this.id, "Source node belongs to another graph!");
		assert(() => target.graphId === this.id, "Target node belongs to another graph!");
		assert(() => !this.createsCycle(source, target), "Edge create a cycle!");

		return this._edges.allocWithId(Edge, {
			source: source.id,
			outputPort: outputPort.toString(),
			target: target.id,
			inputPort: inputPort.toString()
		});
	}

	public tryConnect<Source extends NodeType<any, any>, Target extends NodeType<any, any>>(source: InstanceType<Source>, outputPort: string | number | symbol, target: InstanceType<Target>, inputPort: string | number | symbol): Result<Edge, GraphError> {
		if (source.graphId === this.id)
			return Err(GraphError.InvalidNode(this, source));

		if (target.graphId === this.id)
			return Err(GraphError.InvalidNode(this, target));

		if (this.createsCycle(source, target))
			return Err(GraphError.EdgeCycle());

		return Ok(this._edges.allocWithId(Edge, {
			source: source.id,
			outputPort: outputPort.toString(),
			target: target.id,
			inputPort: inputPort.toString()
		}));
	}

	public canConnect<Source extends NodeType<any, any>, Target extends NodeType<any, any>>(source: InstanceType<Source>, target: InstanceType<Target>): boolean {
		if (source.graphId === this.id)
			return false;

		if (target.graphId === this.id)
			return false;

		if (this.createsCycle(source, target))
			return false;

		return true;
	}

	public removeEdge(edge: Edge) {
		this._edges.free(edge.id);
	}

	public serialize(): SerializedGraph {
		return {
			type: this.constructor.name,
			id: this.id,
			name: this.name,
			nodes: this.nodes,
			edges: this.edges,
		};
	}

	private createsCycle<Source extends NodeType<any, any>, Target extends NodeType<any, any>>(source: InstanceType<Source>, target: InstanceType<Target>): boolean {
		if (source.id === target.id)
			return true;

		const visited = new Set<number>();
		const stack = [target.id];

		while (stack.length > 0) {
			const id = stack.pop()!;

			if (id === source.id)
				return true;

			if (visited.has(id))
				continue;

			visited.add(id);

			for (const edge of this.edges)
				if (edge.source === id)
					stack.push(edge.target);
		}

		return false;
	}
}

export type SerializedGraph = {
	readonly type: string;
	readonly id: number;
	readonly name: string;
	readonly nodes: Node[];
	readonly edges: Edge[];
}

export type GraphType<T extends Graph> = new (id: number, name: string, nodes?: Node[], edges?: Edge[]) => T;

export type GraphInputName<T extends Graph> = keyof T["inputs"];
export type GraphOutputName<T extends Graph> = keyof T["outputs"];

export class Edge {
	public readonly id!: number;
	public readonly source!: number;
	public readonly outputPort!: string;
	public readonly target!: number;
	public readonly inputPort!: string;

	public constructor(id: number, { source: source, outputPort, target, inputPort }: EdgeProps) {
		this.id = id;
		this.source = source;
		this.outputPort = outputPort;
		this.target = target;
		this.inputPort = inputPort;
	}
}

export type EdgeProps = Omit<Edge, "id">;

export type GraphNodeType<T extends Graph> = InstanceType<T["nodeTypes"][number]>;

export type GraphIO = Record<string, Type>;

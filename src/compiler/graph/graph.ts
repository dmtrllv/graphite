import { Allocator, assert, Err, Ok, Result } from "@utils";
import { Node, type NodeType } from "./nodes/node";
import { type Type } from "../types";
import { getNodeType, GraphOutputNode, type NodeProps } from "./nodes";
import { GraphError } from "./error";
import { Group, type GroupInputProps, type GroupOutputProps, type GroupType } from "./group";
import { getGroupType } from "./group-types";
import type { CompilationContext } from "../context";
import type { CompiledData } from "../compiler";

/**
 * The base class for all graphs
 */
export abstract class Graph<Props extends {}> {
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

	public get outputNode() {
		const node = assert.notNull(this.getNode(0));
		assert(() => node instanceof GraphOutputNode, `First node is not a ${GraphOutputNode.name}!`);
		return node;
	}

	public get inputs(): GraphIO {
		return {};
	}

	public get outputs(): GraphIO {
		return {};
	}

	public name: string;
	public readonly props: Props;

	public abstract get nodeTypes(): NodeType<any, any>[];

	public constructor(id: number, name: string, props: Props, nodes: Node[] = [], edges: Edge[] = [], groups: Group[] = []) {
		this.id = id;
		this.name = name;
		this.props = props;
		this._nodes = new Allocator(Node);
		this._edges = new Allocator(Edge);
		this._groups = new Allocator(Group);
		nodes.forEach(node => this._nodes.allocAt(node.id, getNodeType(node.type), node.id, this.id, node.props as any));
		edges.forEach(edge => this._edges.allocWithId(Edge, edge));
		groups.forEach(group => this._groups.allocAt(group.id, getGroupType(group.type), group.id, group.name, group.nodes, group.parent));
		if (!this._nodes.get(0))
			this._nodes.allocWithId(GraphOutputNode, this.id, { graphId: id });
	}

	public abstract compile(ctx: CompilationContext): CompiledData | Promise<CompiledData>; 

	public getNode(id: number): Node | undefined;
	public getNode<T extends Node>(id: number, type: NodeType<T, any>): T;
	public getNode<T extends Node>(id: number, type?: NodeType<T, any>): T | undefined {
		const node = this._nodes.get(id);
		if (node && type)
			assert(() => node instanceof type, `node is not a ${type.name}!`);
		return node as T;
	}

	public getEdge(id: number): Edge | undefined {
		return this._edges.get(id);
	}

	public addNode<T extends GraphNodeType<this>, P extends NodeProps<T>>(type: NodeType<T, P>, props: P): T {
		assert(() => this.nodeTypes.includes(type), `invalid node type ${type.name} for graph ${this.name}`);
		return this._nodes.allocWithId(type, this.id, props);
	}

	public addEdge(props: EdgeProps): any {
		return this._edges.allocWithId(Edge, props)
	}

	private isGroupIONode(group: Group, node: Node): boolean {
		return (group.inputNodeType && (node instanceof group.inputNodeType)) || (group.outputNodeType && (node instanceof group.outputNodeType)) || false;
	}

	public addGroup<T extends Group>(type: GroupType<T>, name: string, inputProps: GroupInputProps<T>, outputProps: GroupOutputProps<T>, parent?: Group): T {
		const group = this._groups.allocWithId(type, name, [], parent?.id);

		group.addNode(this._nodes.allocWithId(group.inputNodeType, this.id, { groupId: group.id, ...inputProps }).id);
		group.addNode(this._nodes.allocWithId(group.outputNodeType, this.id, { groupId: group.id, ...outputProps }).id);

		return group;
	}

	private getNodeGroup(nodeId: number): Group | null {
		return this.groups.find(g => g.nodes.includes(nodeId)) ?? null;
	}

	private isGroupWithin(group: Group | null, parent: Group | null): boolean {
		while (group) {
			if (group === parent)
				return true;
			group = group.parent === null ? null : this._groups.get(group.parent)!;
		}
		return parent === null;
	}

	public transferNode<T extends GraphNodeType<this>>(node: T, group: Group | null) {
		const currentGroup = this.getNodeGroup(node.id);

		if (currentGroup === group)
			return;

		if (currentGroup && this.isGroupIONode(currentGroup, node))
			return;

		for (const edge of this.edges) {
			if (edge.source === node.id && !this.isGroupWithin(this.getNodeGroup(edge.target), group))
				return;
			if (edge.target === node.id && !this.isGroupWithin(group, this.getNodeGroup(edge.source)))
				return;
		}

		currentGroup?.removeNode(node.id);
		group?.addNode(node.id);
	}

	public removeGroup(id: number): void;
	public removeGroup(group: Group): void;
	public removeGroup(idOrGroup: number | Group) {
		let group: Group;

		if (typeof idOrGroup === "number") {
			group = assert.notNull(this._groups.get(idOrGroup));
		} else {
			group = idOrGroup;
		}

		this._groups.all().filter(g => g.parent === group.id).forEach(g => {
			this.removeGroup(g);
		});

		group.nodes.forEach(node => this.removeNodeAt(node));

		this._groups.free(group.id);
	}

	public tryAddNode<T extends Node<Props>, Props extends {}>(type: NodeType<T, Props>, props: Props): Result<T, GraphError> {
		return Result.try(() => {
			if (!this.nodeTypes.includes(type))
				return Err(GraphError.InvalidNodeType(this, type));
			return Ok(this._nodes.allocWithId(type, this.id, props));
		}, GraphError.Error);
	}

	private removeNodeAt(index: number) {
		const node = this.getNode(index);
		if (!node)
			return;

		for (const edge of this.edges)
			if (edge.source === node.id || edge.target === node.id)
				this._edges.free(edge.id);

		this._nodes.free(node.id);
	}

	public removeNode(node: GraphNodeType<this>) {
		const group = this.getNodeGroup(node.id);

		if (group && this.isGroupIONode(group, node))
			return;

		group?.removeNode(node.id);
		this.removeNodeAt(node.id);
	}

	public removeEdge(edge: Edge) {
		this._edges.free(edge.id);
	}

	public serialize(): SerializedGraph {
		return {
			type: this.constructor.name,
			id: this.id,
			name: this.name,
			props: this.props,
			nodes: this.nodes,
			edges: this.edges,
			groups: this.groups,
		};
	}
}

export type CompiledExpression = {
	readonly expression: string;
	readonly statements: string[];
};

export type SerializedGraph = {
	readonly type: string;
	readonly id: number;
	readonly name: string;
	readonly props: object;
	readonly nodes: Node[];
	readonly edges: Edge[];
	readonly groups: Group[];
}

export type GraphType<T extends Graph<Props>, Props extends {}> = new (id: number, name: string, props: Props, nodes?: Node[], edges?: Edge[], groups?: Group[]) => T;

export type GraphInputName<T extends Graph<any>> = keyof T["inputs"];
export type GraphOutputName<T extends Graph<any>> = keyof T["outputs"];

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

export type GraphNodeType<T extends Graph<any>> = InstanceType<T["nodeTypes"][number]>;

export type GraphIO = Record<string, Type>;

export type GraphProps<T extends Graph<any>> = T extends Graph<infer Props> ? Props : never;
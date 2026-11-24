import { Allocator, assert, Err, Ok, Result } from "@utils";
import { Node, type NodeType } from "./nodes/node";
import { getWGSLType, type Type } from "../types";
import { getNodeType, GraphOutputNode, type CompiledNode, type NodeOutputName, type NodeProps } from "./nodes";
import { GraphError } from "./error";
import type { MatchingNodeInputPortNames } from "./graph-manager";
import { Group, compileNode, type GroupType } from "./group";
import { getGroupType } from "./group-types";
import type { CompileContext } from "../context";

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

	public abstract get nodeTypes(): NodeType<any, any>[];

	public constructor(id: number, name: string, nodes: Node[] = [], edges: Edge[] = [], groups: Group[] = []) {
		this.id = id;
		this.name = name;
		this._nodes = new Allocator(Node);
		this._edges = new Allocator(Edge);
		this._groups = new Allocator(Group);
		nodes.forEach(node => this._nodes.allocAt(node.id, getNodeType(node.type), node.id, this.id, node.props as any));
		edges.forEach(edge => this._edges.allocWithId(Edge, edge));
		groups.forEach(group => this._groups.allocAt(group.id, getGroupType(group.type), group.id, group.name, group.nodes, group.parent));
		if (!this._nodes.get(0))
			this._nodes.allocWithId(GraphOutputNode, this.id, { graphId: id });
	}

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
		return this._nodes.allocWithId(type, this.id, props);
	}

	private isGroupIONode(group: Group, node: Node): boolean {
		return (group.inputNodeType && (node instanceof group.inputNodeType)) || (group.outputNodeType && (node instanceof group.outputNodeType)) || false;
	}

	public addGroup<T extends Group>(type: GroupType<T>, name: string, parent?: Group): T {
		const group = this._groups.allocWithId(type, name, [], parent?.id);

		if (group.inputNodeType)
			group.addNode(this._nodes.allocWithId(group.inputNodeType, this.id, {}).id);

		if (group.outputNodeType)
			group.addNode(this._nodes.allocWithId(group.outputNodeType, this.id, {}).id);

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

		if (target.graphId !== this.id)
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

		if (target.graphId !== this.id)
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
			groups: this.groups,
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

	public async compile(ctx: CompileContext): Promise<CompiledGraph> {
		const functionName = `graph_${this.id}_${this.name.replace(/[^a-zA-Z0-9_]/g, "_")}`;
		const inputType = `${functionName}_Input`;
		const outputType = `${functionName}_Output`;

		const inputs = this.inputs;
		const outputs = this.outputs;
		const resolved = new Map<Node, CompiledNode>();
		const outputExpressions: Record<string, string> = {};
		const statements = new Set<string>();
		const outputEdges = this.getNodeInputEdges(this.outputNode);

		for (const name of Object.keys(outputs)) {
			const edge = outputEdges[name]!;
			const source = this.getNode(edge.source)!;
			const compiled = await compileNode(this, ctx, source, null, resolved);

			outputExpressions[name] = compiled.outputs[edge.outputPort]!;
			compiled.statements.forEach(statement => statements.add(statement));
		}

		const inputFields = Object.entries(inputs).map(([name, type]) => `\t${name}: ${getWGSLType(type)},`).join("\n");
		const outputFields = Object.entries(outputs).map(([name, type]) => `\t${name}: ${getWGSLType(type)},`).join("\n");
		const outputValues = Object.keys(outputs).map(name => outputExpressions[name]).join(",\n\t\t");

		const source = [
			`struct ${inputType} {`,
			inputFields,
			"};",
			"",
			`struct ${outputType} {`,
			outputFields,
			"};",
			"",
			`fn ${functionName}(input: ${inputType}) -> ${outputType} {`,
			...[...statements].map(statement => `\t${statement}`),
			`\treturn ${outputType}(`,
			`\t\t${outputValues}`,
			"\t);",
			"}"
		].join("\n");

		return { functionName, inputType, outputType, source };
	}

	private getNodeInputEdges(node: Node): Record<string, Edge> {
		const edges: Record<string, Edge> = {};

		for (const edge of this.edges)
			if (edge.target === node.id)
				edges[edge.inputPort] = edge;

		return edges;
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
	readonly nodes: Node[];
	readonly edges: Edge[];
	readonly groups: Group[];
}

export type GraphType<T extends Graph> = new (id: number, name: string, nodes?: Node[], edges?: Edge[], groups?: Group[]) => T;

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

export type CompiledGraph = {
	readonly functionName: string;
	readonly inputType: string;
	readonly outputType: string;
	readonly source: string;
};
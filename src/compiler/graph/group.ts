import type { CompileContext } from "../context";
import type { Graph } from "./graph";
import type { GraphManager } from "./graph-manager";
import type { Node, CompiledNode, NodeType } from "./nodes/node";

export class Group {
	public readonly id: number;
	public readonly nodes: number[];
	public readonly parent: number | null;

	public name: string;

	public get type() {
		return this.constructor.name;
	}

	public get inputNodeType(): NodeType<any, any> | undefined {
		return undefined;
	}

	public get outputNodeType(): NodeType<any, any> | undefined {
		return undefined;
	}

	public constructor(id: number, name: string, nodes: number[] = [], parent: number | null = null) {
		this.id = id;
		this.name = name;
		this.nodes = nodes;
		this.parent = parent;
	}

	public async compile(context: GroupCompileContext): Promise<CompiledNode> {
		const compiled = await compileGroupBody(context);
		return {
			outputs: compiled.outputs,
			statements: [...context.input.statements, ...compiled.statements]
		};
	}

	public addNode(id: number) {
		if (!this.nodes.includes(id))
			this.nodes.push(id);
	}

	public removeNode(id: any) {
		const index = this.nodes.indexOf(id);
		if (index > -1)
			this.nodes.splice(index, 1);
	}

	public toJSON() {
		return {
			type: this.type,
			id: this.id,
			name: this.name,
			nodes: this.nodes,
			parent: this.parent,
		};
	}
}

export type GroupCompileContext = {
	readonly graph: Graph;
	readonly ctx: CompileContext;
	readonly manager: GraphManager;
	readonly group: Group;
	readonly parent: Group | null;
	readonly inputNode: Node | null;
	readonly outputNode: Node;
	readonly input: CompiledNode;
};

export const compileNode = async (graph: Graph, ctx: CompileContext, node: Node, scope: Group | null, resolved: Map<Node, CompiledNode>): Promise<CompiledNode> => {
	const cached = resolved.get(node);
	if (cached)
		return cached;

	const childGroup = graph.groups.find(group => group.parent === (scope?.id ?? null) && group.outputNodeType && node instanceof group.outputNodeType);
	if (childGroup) {
		const compiled = await compileGroup(graph, ctx, childGroup, scope, resolved);
		resolved.set(node, compiled);
		return compiled;
	}

	const inputs: Record<string, string> = {};
	const statements = new Set<string>();

	for (const edge of graph.edges.filter(edge => edge.target === node.id)) {
		const source = graph.getNode(edge.source)!;
		const compiled = await compileNode(graph, ctx, source, scope, resolved);
		compiled.statements.forEach(statement => statements.add(statement));
		inputs[edge.inputPort] = compiled.outputs[edge.outputPort]!;
	}

	const compiled = await node.compile(ctx, inputs);
	const result = {
		outputs: compiled.outputs,
		statements: [...statements, ...compiled.statements]
	};

	resolved.set(node, result);
	return result;
};

const compileGroup = async (graph: Graph, ctx: CompileContext, group: Group, parent: Group | null, resolved: Map<Node, CompiledNode>): Promise<CompiledNode> => {
	const inputNodeType = group.inputNodeType;
	const outputNodeType = group.outputNodeType;
	const inputNode = inputNodeType ? graph.nodes.find(node => group.nodes.includes(node.id) && node instanceof inputNodeType) ?? null : null;
	const outputNode = graph.nodes.find(node => group.nodes.includes(node.id) && outputNodeType && node instanceof outputNodeType)!;

	const inputs: Record<string, string> = {};
	const statements = new Set<string>();

	if (inputNode) {
		for (const edge of graph.edges.filter(edge => edge.target === inputNode.id)) {
			const source = graph.getNode(edge.source)!;
			const compiled = await compileNode(graph, ctx, source, parent, resolved);
			compiled.statements.forEach(statement => statements.add(statement));
			inputs[edge.inputPort] = compiled.outputs[edge.outputPort]!;
		}
	}

	const compiledInput = inputNode ? await inputNode.compile(ctx, inputs) : { outputs: {}, statements: [] };
	const context: GroupCompileContext = {
		graph,
		ctx,
		manager: ctx.manager,
		group,
		parent,
		inputNode,
		outputNode,
		input: {
			outputs: compiledInput.outputs,
			statements: [...statements, ...compiledInput.statements]
		}
	};

	return group.compile(context);
};

export const compileGroupBody = async (context: GroupCompileContext, input: CompiledNode = context.input, skipInputs: string[] = []): Promise<CompiledNode> => {
	const resolved = new Map<Node, CompiledNode>();
	if (context.inputNode)
		resolved.set(context.inputNode, input);

	const outputs = { ...input.outputs };
	const statements = new Set<string>();
	const outputPorts = context.outputNode.getInputs(context.manager);

	for (const name of Object.keys(outputPorts)) {
		if (skipInputs.includes(name))
			continue;

		const edge = context.graph.edges.find(edge => edge.target === context.outputNode.id && edge.inputPort === name);
		if (!edge)
			continue;

		const source = context.graph.getNode(edge.source)!;
		const compiled = await compileNode(context.graph, context.ctx, source, context.group, resolved);
		compiled.statements.forEach(statement => statements.add(statement));
		outputs[name] = compiled.outputs[edge.outputPort]!;
	}

	return { outputs, statements: [...statements] };
};

export type GroupType<T extends Group> = new (id: number, name: string, nodes?: number[], parent?: number | null) => T;

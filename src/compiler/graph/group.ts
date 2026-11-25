import type { CompiledData } from "../compiler";
import type { CompilationContext } from "../context";
import { GroupInputNode, GroupOutputNode } from "./nodes/group";
import type { NodeType } from "./nodes/node";

/**
 * A `Group` is like a scope with 1 input and output boundary node.
 */
export class Group {
	public readonly id: number;
	public readonly nodes: number[];
	public readonly parent: number | null;

	public name: string;

	public async compile(_ctx: CompilationContext): Promise<CompiledGroup> {
		throw new Error("todo");
	}

	public get type() {
		return this.constructor.name;
	}

	public get inputNodeType(): NodeType<GroupInputNode<any>, any> {
		return GroupInputNode;
	}

	public get outputNodeType(): NodeType<GroupOutputNode<any>, any> {
		return GroupOutputNode;
	}

	public constructor(id: number, name: string, nodes: number[] = [], parent: number | null = null) {
		this.id = id;
		this.name = name;
		this.nodes = nodes;
		this.parent = parent;
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

export type GroupType<T extends Group> = new (id: number, name: string, nodes?: number[], parent?: number | null) => T;
export type GroupInputProps<T extends Group> = InstanceType<T["inputNodeType"]> extends GroupInputNode<infer P> ? Omit<P, "groupId"> : never;
export type GroupOutputProps<T extends Group> = InstanceType<T["outputNodeType"]> extends GroupOutputNode<infer P> ? Omit<P, "groupId"> : never;

export type CompiledGroup = CompiledData<{
	readonly outputs: Record<string, string>;
}>;

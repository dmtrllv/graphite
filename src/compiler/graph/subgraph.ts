import type { CompiledData } from "../compiler";
import type { CompilationContext } from "../context";
import type { Type } from "../types";
import { Graph } from "./graph";
import { DEFAULT_NODES, GraphInputNode } from "./nodes";

/**
 * A subgraph is like a regular function it takes some inputs and produces some outputs
 * It can be instantiated/called in any kind of graph at any place.
 */
export class SubGraph extends Graph<{}> {
	public override get nodeTypes() {
		return [
			...DEFAULT_NODES,
			GraphInputNode
		];
	}

	public override compile(_ctx: CompilationContext): CompiledSubGraph {
		throw new Error("Method not implemented.");
	}
}

export type CompiledSubGraph = CompiledData<{
	readonly inputs: Record<string, Type>;
	readonly outputs: Record<string, Type>;
}>;
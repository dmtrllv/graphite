import type { CompileContext } from "../../context";
import { Node, type CompiledNode } from "./node";

export class SimulationInputNode extends Node {
	public override compile(_ctx: CompileContext, _inputs: Record<string, string>): CompiledNode {
		throw new Error("Method not implemented.");
	}
}

export class SimulationOutputNode extends Node {
	public override compile(_ctx: CompileContext, _inputs: Record<string, string>): CompiledNode {
		throw new Error("Method not implemented.");
	}

}
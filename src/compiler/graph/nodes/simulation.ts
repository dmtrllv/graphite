import type { CompileContext } from "../../context";
import { Node } from "./node";

export class SimulationInputNode extends Node {
	public override compile(ctx: CompileContext, inputs: Record<string, string>): string {
		throw new Error("Method not implemented.");
	}

}

export class SimulationOutputNode extends Node {
	public override compile(ctx: CompileContext, inputs: Record<string, string>): string {
		throw new Error("Method not implemented.");
	}

}
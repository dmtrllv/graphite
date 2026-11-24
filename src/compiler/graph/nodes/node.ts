import { type Type } from "../../types";
import { type Edge, } from "../graph";

export abstract class Node {
	public readonly id: number;

	private _inputEdges: Partial<Record<NodeInputPortName<this>, Edge | undefined>> = {};
	private _outputEdges: Partial<Record<NodeOutputPortName<this>, Edge[]>> = {};

	public get inputs(): NodePorts {
		return {};
	}

	public get outputs(): NodePorts {
		return {};
	}

	public constructor(id: number) {
		this.id = id;
	}

	public getInputEdge(port: NodeInputPortName<this>): Edge | undefined {
		return this._inputEdges[port];
	}


	public getOutputEdges(port: NodeInputPortName<this>): Edge[] {
		return this._outputEdges[port] || [];
	}

	//public abstract compile(context: CompileContext): void;
}

export type NodePorts = Record<string, Type>;

export type NodeType<T extends Node, Args extends any[]> = new (id: number, ...args: Args) => T;

export type NodeInputPortName<T extends Node> = keyof T["inputs"];
export type NodeOutputPortName<T extends Node> = keyof T["outputs"];

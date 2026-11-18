import { Graph, type GraphNode, type NodeEdge } from "../graph";
import { observable } from "../reactive";
import { GraphEditor } from "./editor";
import { Vec2 } from "./types";

export class GraphManager {
	#idCounter = 0;

	@observable
	public accessor graphs = new Map<number, Graph>();

	@observable
	public accessor editors = new Map<Graph, GraphEditor>();

	public get(id: number): Graph | undefined;
	public get(name: string): Graph | undefined;
	public get(idOrName: number | string): Graph | undefined {
		if (typeof idOrName === "number")
			return this.graphs.get(idOrName);

		return this.graphs.values().find(graph => graph.name === idOrName);
	}

	public openEditor(graph: Graph): GraphEditor {
		let editor = this.editors.get(graph);

		if (!editor) {
			editor = new GraphEditor(graph);
			this.editors.set(graph, editor);
		}

		return editor;
	}

	public add(name: string, offset: Vec2 = new Vec2(), nodes?: Map<number, GraphNode>, edges?: Map<number, NodeEdge>): Graph {
		if (this.get(name))
			throw new DuplicateGraphNameError(name);

		const id = this.#idCounter++;
		const graph = new Graph(id, name, offset, nodes, edges);
		this.graphs.set(id, graph);
		return graph;
	}

	public restore(graph: Graph): void {
		if (this.graphs.has(graph.id))
			throw new Error(`Graph with ID ${graph.id} already exists!`);

		if (this.get(graph.name))
			throw new DuplicateGraphNameError(graph.name);

		this.graphs.set(graph.id, graph);
		this.#idCounter = Math.max(this.#idCounter, graph.id + 1);
	}
}

export class DuplicateGraphNameError extends Error {
	public constructor(name: string) {
		super(`Graph with name ${name} already exists!`);
	}
}

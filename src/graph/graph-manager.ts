import { Graph, ScalarNode, type GraphNode, type NodeEdge } from "../graph";
import { observable, registerStore } from "../reactive";

@registerStore
export class GraphManager {
	#idCounter = 0;

	@observable({ recursive: true })
	public accessor graphs = new Map<number, Graph>();

	public constructor() {
		const graph = this.add("Test");
		graph.addNode(ScalarNode);
	}

	public get(id: number): Graph;
	public get(name: string): Graph;
	public get(idOrName: number | string): Graph | undefined {
		if (typeof idOrName === "number")
			return this.graphs.get(idOrName);
		return this.graphs.values().find(graph => graph.name === idOrName);
	}

	public add(name: string): Graph;
	public add(name: string, nodes?: Map<number, GraphNode>, edges?: Map<number, NodeEdge>): Graph;
	public add(name: string, nodes?: Map<number, GraphNode>, edges?: Map<number, NodeEdge>) {
		if (this.get(name))
			throw new DuplicateGraphNameError(name);

		const id = this.#idCounter++;
		const graph = new Graph(id, name, nodes, edges);
		this.graphs.set(id, graph);
		return graph;
	}
}

export class DuplicateGraphNameError extends Error {
	public constructor(name: string) {
		super(`Graph with name ${name} already exists!`);
	}
}
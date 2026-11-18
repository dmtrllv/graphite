import { Graph, ScalarNode, Vec2, VectorMathNode, type GraphNode, type NodeEdge } from "../graph";
import { observable } from "../reactive";
import { GraphEditor } from "./editor";

export class GraphManager {
	#idCounter = 0;

	@observable
	public accessor graphs = new Map<number, Graph>();

	@observable
	public accessor editors = new Map<Graph, GraphEditor>();

	public constructor() {
		const graph = this.add("Test");
		const a = graph.addNode(ScalarNode, new Vec2(-200, 0));
		const b = graph.addNode(ScalarNode, new Vec2(-200, -200));
		const c = graph.addNode(VectorMathNode, new Vec2(200, 0));
		graph.addEdge(a, "value", c, "a");
		graph.addEdge(b, "value", c, "b");
	}

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
}

export class DuplicateGraphNameError extends Error {
	public constructor(name: string) {
		super(`Graph with name ${name} already exists!`);
	}
}

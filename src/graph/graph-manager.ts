import { Graph, type GraphNode, type NodeEdge } from "../graph";
import { observable } from "../reactive";
import { GraphEditor } from "./editor";
import { Vec2 } from "./types";

export class GraphManager {
	private _idCounter = 0;

	@observable
	public accessor graphs = new Map<number, Graph>();

	@observable
	public accessor editors = new Map<Graph, GraphEditor>();

	public constructor(createWorldGraph = true) {
		if (createWorldGraph)
			this.add("World");
	}

	public get worldGraph(): Graph {
		const graph = this.graphs.values().next().value;

		if (!graph)
			throw new Error("GraphManager does not contain a World Graph!");

		return graph;
	}

	public get(id: number): Graph | undefined;
	public get(name: string): Graph | undefined;
	public get(idOrName: number | string): Graph | undefined {
		if (typeof idOrName === "number")
			return this.graphs.get(idOrName);

		return [...this.graphs.values()].find(graph => graph.name === idOrName);
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

		const id = this._idCounter++;
		const graph = new Graph(id, name, offset, nodes, edges, this.graphs.size === 0);
		graph.setManager(this);
		this.graphs.set(id, graph);
		return graph;
	}

	public restore(graph: Graph): void {
		if (this.graphs.has(graph.id))
			throw new Error(`Graph with ID ${graph.id} already exists!`);

		if (this.get(graph.name))
			throw new DuplicateGraphNameError(graph.name);

		if (this.graphs.size === 0)
			graph.setWorldGraph(true);
		else if (graph.isWorldGraph)
			throw new Error("A GraphManager can only contain one World Graph!");

		graph.setManager(this);
		this.graphs.set(graph.id, graph);
		this._idCounter = Math.max(this._idCounter, graph.id + 1);
	}

	public notifyInterfaceChanged(graph: Graph): void {
		for (const candidate of this.graphs.values()) {
			if (candidate === graph)
				continue;

			const affected = [...candidate.nodes.values()].some(node => "graphId" in node && node.graphId === graph.id);

			if (affected) {
				candidate.reconcileEdges();
				candidate.structureVersion++;
			}
		}
	}

	public createSubgraph(): Graph {
		let index = 1;
		let name = `Subgraph ${index}`;

		while (this.get(name))
			name = `Subgraph ${++index}`;

		return this.add(name);
	}

	public rename(graph: Graph, name: string): void {
		const normalized = name.trim();

		if (!normalized)
			throw new Error("Graph name cannot be empty!");

		const existing = this.get(normalized);

		if (existing && existing !== graph)
			throw new DuplicateGraphNameError(normalized);

		if (graph.isWorldGraph)
			throw new Error("The World Graph cannot be renamed!");

		graph.name = normalized;
	}

	public hasRecursiveReference(parent: Graph, definition: Graph): boolean {
		const visited = new Set<number>();

		const contains = (graph: Graph): boolean => {
			if (graph === parent)
				return true;

			if (visited.has(graph.id))
				return false;

			visited.add(graph.id);

			for (const node of graph.nodes.values()) {
				if (!("graphId" in node) || typeof node.graphId !== "number")
					continue;

				const child = this.get(node.graphId);

				if (child && contains(child))
					return true;
			}

			return false;
		};

		return contains(definition);
	}

	public removeGraph(graph: Graph): void {
		if (graph.isWorldGraph)
			throw new Error("The World Graph cannot be removed!");

		if (this.graphs.get(graph.id) !== graph)
			return;

		for (const candidate of this.graphs.values()) {
			if (candidate === graph)
				continue;

			for (const node of [...candidate.nodes.values()]) {
				if ("graphId" in node && node.graphId === graph.id)
					candidate.removeNode(node);
			}
		}

		const editor = this.editors.get(graph);

		if (editor) {
			editor.activeTool?.cancel();
			editor.selectedNodes = [];
			this.editors.delete(graph);
		}

		this.graphs.delete(graph.id);
	}
}

export class DuplicateGraphNameError extends Error {
	public constructor(name: string) {
		super(`Graph with name ${name} already exists!`);
	}
}

import { Graph, PassGraph, SimulationGraph, Subgraph, WorldGraph } from "./graph";
import { SubgraphNode } from "./nodes";
import { Serializable, serializable, mapOf } from "../serializable";
import { observable } from "@reactive";
import { GraphEditor } from "./editor";
import { GraphViewport } from "./viewport";
import { validateSimulationGraph } from "./simulation-graph";
import type { ActionHistory } from "../actions";

@observable
@serializable({ type: "graph-manager", create: () => new GraphManager(false) })
export class GraphManager extends Serializable {
	private _idCounter = 0;

	@observable
	@serializable(mapOf(Number, Graph, manager => ({ manager })))
	public accessor graphs = new Map<number, Graph>();

	@observable
	@serializable(mapOf(Number, GraphViewport))
	public accessor viewports = new Map<number, GraphViewport>();

	@observable
	public accessor editors = new Map<number, GraphEditor>();

	@observable
	public accessor catalogVersion = 0;

	private history?: ActionHistory;

	public get worldGraph(): WorldGraph {
		const graph = [...this.graphs.values()].find((graph): graph is WorldGraph => graph instanceof WorldGraph);

		if (!graph)
			throw new Error("GraphManager does not contain a World Graph!");

		return graph;
	}

	public constructor(createWorldGraph = true) {
		super();
		if (createWorldGraph)
			this.createWorldGraph();
	}

	protected override initialize(): void {
		this._idCounter = 0;

		if (![...this.graphs.values()].some(graph => graph instanceof WorldGraph))
			throw new Error("GraphManager must contain a WorldGraph!");

		for (const graph of this.graphs.values()) {
			graph.setManager(this);
			this._idCounter = Math.max(this._idCounter, graph.id + 1);

			if (!this.viewports.has(graph.id))
				this.viewports.set(graph.id, new GraphViewport());

			graph.ensureOutputNode();
			graph.validate();

			if (graph instanceof SimulationGraph)
				validateSimulationGraph(graph);
		}

		this.validateReferences();
	}

	public setHistory(history: ActionHistory): void {
		this.history = history;
	}

	public get(id: number): Graph | undefined;
	public get(name: string): Graph | undefined;
	public get(idOrName: number | string): Graph | undefined {
		if (typeof idOrName === "number")
			return this.graphs.get(idOrName);

		return [...this.graphs.values()].find(graph => graph.name === idOrName);
	}

	public openEditor(graph: Graph): GraphEditor {
		if (this.graphs.get(graph.id) !== graph)
			throw new Error("Cannot open a graph that does not belong to this GraphManager!");

		let editor = this.editors.get(graph.id);

		if (!editor) {
			let viewport = this.viewports.get(graph.id);

			if (!viewport) {
				viewport = new GraphViewport();
				this.viewports.set(graph.id, viewport);
			}

			if (!this.history)
				throw new Error("GraphManager has no ActionHistory!");

			editor = new GraphEditor(graph, this.history, viewport);
			
			this.editors.set(graph.id, editor);
		}

		return editor;
	}

	private createName(prefix: string): string {
		let index = 1;
		let name = `${prefix} ${index}`;

		while (this.get(name))
			name = `${prefix} ${++index}`;

		return name;
	}

	public createWorldGraph(name = "World"): WorldGraph {
		if ([...this.graphs.values()].some(graph => graph instanceof WorldGraph))
			throw new Error("A GraphManager can only contain one World Graph!");

		const graph = new WorldGraph(this._idCounter++, name);
		return this.register(graph) as WorldGraph;
	}

	public createSubgraph(name = this.createName("Subgraph")): Subgraph {
		return this.register(new Subgraph(this._idCounter++, name)) as Subgraph;
	}

	public createPassGraph(name = this.createName("Pass")): PassGraph {
		return this.register(new PassGraph(this._idCounter++, name)) as PassGraph;
	}

	public createSimulationGraph(name = this.createName("Simulation")): SimulationGraph {
		return this.register(new SimulationGraph(this._idCounter++, name)) as SimulationGraph;
	}

	private register<T extends Graph>(graph: T): T {
		if (this.get(graph.name))
			throw new DuplicateGraphNameError(graph.name);

		if (this.graphs.has(graph.id))
			throw new Error(`Graph with ID ${graph.id} already exists!`);

		if (graph instanceof WorldGraph && [...this.graphs.values()].some(item => item instanceof WorldGraph))
			throw new Error("A GraphManager can only contain one World Graph!");

		graph.setManager(this);
		this.graphs.set(graph.id, graph);

		try {
			graph.ensureOutputNode();
			graph.validate();
			if (graph instanceof SimulationGraph)
				validateSimulationGraph(graph);
			this.validateReferences();
		} catch (error) {
			this.graphs.delete(graph.id);
			throw error;
		}

		this.viewports.set(graph.id, new GraphViewport());
		this.catalogVersion++;
		return graph;
	}

	public restore(graph: Graph): void {
		this.register(graph);
		this._idCounter = Math.max(this._idCounter, graph.id + 1);
	}

	public notifySubgraphTopologyChanged(): void {
		this.catalogVersion++;
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

	public rename(graph: Graph, name: string): void {
		const normalized = name.trim();

		if (!normalized)
			throw new Error("Graph name cannot be empty!");

		const existing = this.get(normalized);

		if (existing && existing !== graph)
			throw new DuplicateGraphNameError(normalized);

		if (graph instanceof WorldGraph)
			throw new Error("The World Graph cannot be renamed!");

		if (this.graphs.get(graph.id) !== graph)
			throw new Error("Graph does not belong to this GraphManager!");

		graph.name = normalized;
		this.catalogVersion++;
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
				if (!(node instanceof SubgraphNode) || node.graphId === null)
					continue;

				const child = this.get(node.graphId);

				if (child && contains(child))
					return true;
			}

			return false;
		};

		return contains(definition);
	}

	public getAvailableSubgraphs(parent: Graph): Subgraph[] {
		return [...this.graphs.values()].filter((graph): graph is Subgraph =>
			graph instanceof Subgraph && graph !== parent && !this.hasRecursiveReference(parent, graph)
		);
	}

	public removeGraph(graph: Graph): void {
		if (graph instanceof WorldGraph)
			throw new Error("The World Graph cannot be removed!");

		if (this.graphs.get(graph.id) !== graph)
			return;

		for (const candidate of this.graphs.values()) {
			if (candidate === graph)
				continue;

			for (const node of [...candidate.nodes.values()]) {
				if (node instanceof SubgraphNode && node.graphId === graph.id)
					candidate.removeNode(node);
			}
		}

		const editor = this.editors.get(graph.id);

		if (editor)
			this.closeEditor(graph, editor);

		this.graphs.delete(graph.id);
		this.viewports.delete(graph.id);
		this.catalogVersion++;
	}

	private validateReferences(): void {
		for (const graph of this.graphs.values()) {
			for (const node of graph.nodes.values()) {
				if (!(node instanceof SubgraphNode) || node.graphId === null)
					continue;

				const definition = this.get(node.graphId);

				if (!(definition instanceof Subgraph))
					throw new Error(`SubgraphNode ${node.id} references an invalid Subgraph!`);

				if (this.hasRecursiveReference(graph, definition))
					throw new Error(`SubgraphNode ${node.id} creates a recursive graph reference!`);
			}
		}
	}

	public closeEditor(graph: Graph, editor: GraphEditor): void {
		if (this.editors.get(graph.id) !== editor)
			return;

		editor.dispose();
		this.editors.delete(graph.id);
	}
}

export class DuplicateGraphNameError extends Error {
	public constructor(name: string) {
		super(`Graph with name ${name} already exists!`);
	}
}

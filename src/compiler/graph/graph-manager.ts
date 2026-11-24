import { Allocator, assert, Err, Ok, Result } from "@utils";
import { Graph, type GraphNodeType, type GraphProps, type GraphType, type SerializedGraph } from "./graph";
import { WorldGraph } from "./world";
import { getGraphType } from "./graphs";
import { isNodeType, isSubGraphNode, SubGraphNode, type Node, type NodeInputName, type NodeOutputName, type NodeProps, type NodeType } from "./nodes";
import { GraphError } from "./error";

export class GraphManager {
	private readonly graphs: Allocator<Graph<any>>;

	public get worldGraph(): WorldGraph {
		return this.getGraph(0) as WorldGraph;
	}

	public constructor(graphs?: SerializedGraphs) {
		this.graphs = new Allocator(Graph);
		if (graphs?.length)
			graphs.forEach(g => this.graphs.allocAt(g.id, getGraphType(g.type), g.id, g.name, g.props, g.nodes, g.edges, g.groups));
		else
			this.graphs.allocWithId(WorldGraph, "World", { outputs: {} });
	}

	public serialize(): SerializedGraphs {
		return this.graphs.all().map(g => g.serialize());
	}

	public getGraph(id: number): Graph<any>;
	public getGraph<T extends Graph<any>>(id: number, type: GraphType<T, any>): T;
	public getGraph(id: number, type?: GraphType<any, any>): Graph<any> {
		const graph = assert.notNull(this.graphs.get(id));
		if (type)
			assert(() => graph instanceof type, `Graph with id ${id} is not an instance of ${type.name}!`);
		return graph;
	}

	public getGraphs<T extends Graph<any>>(type: GraphType<T, any>): T[] {
		return this.graphs.all().filter(graph => graph instanceof type) as T[];
	}

	public createGraph<T extends Graph<any>>(type: GraphType<T, any>, name: string, props: GraphProps<T>): T {
		assert(() => !this.graphs.all().find(g => g.name === name), `Graph with name ${name} already exists`);
		return this.graphs.allocWithId(type, name, props);
	}

	public tryCreateGraph<T extends Graph<any>>(type: GraphType<T, any>, name: string, props: GraphProps<T>): Result<T, GraphError> {
		if (this.graphs.all().find(g => g.name === name))
			return Err(GraphError.DuplicateGraphName(name));
		return Ok(this.graphs.allocWithId(type, name, props));
	}

	public addNode<T extends Graph<any>, U extends GraphNodeType<T>, P extends NodeProps<U>>(idOrGraph: number | T, type: NodeType<U, P>, props: P): U {
		const graph = typeof idOrGraph === "number" ? this.getGraph(idOrGraph) : idOrGraph;

		if (isNodeType(type, SubGraphNode)) {
			const subGraph = this.getGraph((props as any).graph);
			assert(() => subGraph !== graph && !this.hasDependency(subGraph, graph), "Recursive subgraphs are not allowed!");
		}

		return graph.addNode(type, props);
	}

	public tryAddNode<T extends Node<P>, P extends {}>(idOrGraph: number | Graph<any>, type: NodeType<T, P>, props: P): Result<T, GraphError> {
		const graph = typeof idOrGraph === "number" ? this.getGraph(idOrGraph) : idOrGraph;

		if (isNodeType(type, SubGraphNode)) {
			const subGraph = this.getGraph((props as any).graph);
			assert(() => subGraph !== graph && !this.hasDependency(subGraph, graph), "Recursive subgraphs are not allowed!");
		}

		return graph.tryAddNode(type, props);
	}

	private hasDependency(graph: Graph<any>, target: Graph<any>, visited = new Set<number>()): boolean {
		if (graph === target)
			return true;

		if (visited.has(graph.id))
			return false;

		visited.add(graph.id);

		for (const node of graph.nodes) {
			if (isSubGraphNode(node) && this.hasDependency(this.getGraph(node.props.graph), target, visited))
				return true;
		}

		return false;
	}
}

export type MatchingNodeInputPortNames<Source extends Node, Target extends Node, OutputKey extends NodeOutputName<Target>> = {
	[K in NodeInputName<Source>]: ReturnType<Target["getOutputs"]>[OutputKey] extends ReturnType<Source["getInputs"]>[K] ? K : never;
}[NodeInputName<Source>];

export type SerializedGraphs = SerializedGraph[];

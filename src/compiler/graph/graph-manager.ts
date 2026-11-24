import { Allocator, assert, Err, Ok, Result } from "@utils";
import { Edge, Graph, type GraphNodeType, type GraphProps, type GraphType, type SerializedGraph } from "./graph";
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
		return Result.try(() => {
			const graph = typeof idOrGraph === "number" ? this.getGraph(idOrGraph) : idOrGraph;

			if (isNodeType(type, SubGraphNode)) {
				const subGraph = this.getGraph((props as any).graph);
				assert(() => subGraph !== graph && !this.hasDependency(subGraph, graph), "Recursive subgraphs are not allowed!");
			}

			return graph.tryAddNode(type, props);
		}, GraphError.Error);
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

	public connect<T extends Graph<any>, Source extends GraphNodeType<T>, K extends NodeOutputName<Source>, Target extends GraphNodeType<T>>(graph: T, source: Source, outputPort: K, target: Target, inputPort: MatchingNodeInputPortNames<Target, Source, K>): Edge {
		assert(() => source.graphId === graph.id, "Source node belongs to another graph!");
		assert(() => target.graphId === graph.id, "Target node belongs to another graph!");
		assert(() => !this.createsCycle(graph, source, target), "Edge create a cycle!");
		assert(() => outputPort in source.getOutputs(this), `Missing output port ${outputPort.toString()}!`);
		assert(() => inputPort in target.getInputs(this), `Missing input port ${outputPort.toString()}!`);

		return graph.addEdge({
			source: source.id,
			outputPort: outputPort.toString(),
			target: target.id,
			inputPort: inputPort.toString()
		});
	}

	public tryConnect<T extends Graph<any>, Source extends NodeType<any, any>, Target extends NodeType<any, any>>(graph: T, source: InstanceType<Source>, outputPort: string | number | symbol, target: InstanceType<Target>, inputPort: string | number | symbol): Result<Edge, GraphError> {
		if (source.graphId !== graph.id)
			return Err(GraphError.InvalidNode(graph, source));

		if (target.graphId !== graph.id)
			return Err(GraphError.InvalidNode(graph, target));

		if (this.createsCycle(graph, source, target))
			return Err(GraphError.EdgeCycle());

		if(outputPort in source.getOutputs(this))
			return Err(GraphError.MissingPort(source, "output", outputPort.toString()));

		if(inputPort in target.getInputs(this))
			return Err(GraphError.MissingPort(target, "input", inputPort.toString()));

		return Ok(graph.addEdge({
			source: source.id,
			outputPort: outputPort.toString(),
			target: target.id,
			inputPort: inputPort.toString()
		}));
	}

	private createsCycle<T extends Graph<any>, Source extends NodeType<any, any>, Target extends NodeType<any, any>>(graph: T, source: InstanceType<Source>, target: InstanceType<Target>): boolean {
		if (source.id === target.id)
			return true;

		const visited = new Set<number>();
		const stack = [target.id];

		while (stack.length > 0) {
			const id = stack.pop()!;

			if (id === source.id)
				return true;

			if (visited.has(id))
				continue;

			visited.add(id);

			for (const edge of graph.edges)
				if (edge.source === id)
					stack.push(edge.target);
		}

		return false;
	}

	public canConnect<T extends Graph<any>, Source extends NodeType<any, any>, Target extends NodeType<any, any>>(graph: T, source: InstanceType<Source>, outputPort: string | number | symbol, target: InstanceType<Target>, inputPort: string | number | symbol): boolean {
		if (source.graphId !== graph.id)
			return false;

		if (target.graphId !== graph.id)
			return false;

		if (this.createsCycle(graph, source, target))
			return false;

		if(outputPort in source.getOutputs(this))
			return false;

		if(inputPort in target.getInputs(this))
			return false;

		return true;
	}
}

export type MatchingNodeInputPortNames<Source extends Node, Target extends Node, OutputKey extends NodeOutputName<Target>> = {
	[K in NodeInputName<Source>]: ReturnType<Target["getOutputs"]>[OutputKey] extends ReturnType<Source["getInputs"]>[K] ? K : never;
}[NodeInputName<Source>];

export type SerializedGraphs = SerializedGraph[];

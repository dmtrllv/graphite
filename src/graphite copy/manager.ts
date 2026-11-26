import { Allocator, assert, Err, Ok, Result } from "@utils";
import { Edge, Graph, type GraphNodeType, type GraphProps, type GraphType, type SerializedGraph } from "./graph";
import { WorldGraph } from "./world";
import { getGraphType } from "./graphs";
import { GraphInputNode, GraphOutputNode, isNodeType, isSubGraphNode, PassNode, SubGraphNode, type Node, type NodeInputName, type NodeOutputName, type InferNodeProps, type NodeType } from "./nodes";
import { GraphError } from "./error";
import { GroupInputNode, GroupOutputNode } from "./nodes";
import type { PassBufferRef } from "./types";
import type { Group, GroupInputProps, GroupOutputProps, GroupType } from "./group";
import { Compiler } from "./compiler";
import type { PassGraph } from "./pass";

export class GraphManager {
	private readonly _graphs: Allocator<Graph<any>>;
	private readonly eventHandlers = new Map<GraphManagerEventName, Set<GraphManagerEventHandler>>();
	private readonly subscribers = new Set<GraphManagerEventSubscriber>();

	public readonly compiler: Compiler;

	public get worldGraph(): WorldGraph {
		// todo: check?
		return this.getGraph(0, WorldGraph);
	}

	//public get passGraphs(): PassGraph[] {
	//	return this._graphs.all().filter(g => g instanceof PassGraph && !(g instanceof WorldGraph)).map(g => g as PassGraph);
	//}

	private _revision: number = 0;

	public get revision() {
		return this._revision;
	}

	public constructor(graphs?: SerializedGraphs) {
		this._graphs = new Allocator(Graph);
		if (graphs?.length)
			graphs.forEach(g => this._graphs.allocAt(g.id, getGraphType(g.type), g.id, g.name, g.props, g.nodes, g.edges, g.groups));
		else
			this._graphs.alloc(WorldGraph, "World", { inputs: {}, outputs: {}, chunkSize: 16, worldSize: 512 });
		for (const graph of this._graphs.all())
			for (const node of graph.nodes)
				if (node instanceof GraphInputNode)
					this.validateGraphInput(graph, node.props.inputName);
		this.compiler = new Compiler(this);
	}

	public readonly getSnapshot = () => this.revision;

	public subscribe(subscriber: GraphManagerEventSubscriber) {
		this.subscribers.add(subscriber);
		return () => { this.subscribers.delete(subscriber); };
	}

	public on<Event extends GraphManagerEventName>(event: Event, handler: GraphManagerEventHandler<Event>) {
		if (!this.eventHandlers.has(event))
			this.eventHandlers.set(event, new Set());
		const handlers = this.eventHandlers.get(event)! as Set<GraphManagerEventHandler<Event>>;
		handlers.add(handler);
		return () => handlers.delete(handler);
	}

	private emit<Event extends GraphManagerEventName>(event: Event, data: GraphManagerEvents[Event]) {
		this._revision++;
		const handlers = this.eventHandlers.get(event);
		if (handlers)
			handlers.forEach(handler => handler(data));
		const subscribeEvent = { event, data };
		this.subscribers.forEach(handler => handler(subscribeEvent));
	}

	public serialize(): SerializedGraphs {
		return this._graphs.all().map(g => g.serialize());
	}

	// ------------ Graph methods ------------
	public getGraph(id: number): Graph<any>;
	public getGraph<T extends Graph<any>>(id: number, type: GraphType<T>): T;
	public getGraph(id: number, type?: GraphType<any, any>): Graph<any> {
		const graph = assert.notNull(this._graphs.get(id));
		if (type)
			assert(() => graph instanceof type, `Graph with id ${id} is not an instance of ${type.name}!`);
		return graph;
	}

	public getGraphs<T extends Graph>(type: GraphType<T>): T[] {
		return this._graphs.all().filter(g => g instanceof type) as T[];
	}
	

	public createGraph<T extends Graph<P>, P extends {}>(type: GraphType<T>, name: string, props: P): T {
		assert(() => !this._graphs.all().find(g => g.name === name), `Graph with name ${name} already exists`);
		const graph = this._graphs.alloc(type, name, props);
		this.emit("graph-added", { graph });
		return graph;
	}

	public updateGraphProps<T extends Graph<any>>(graph: T, key: keyof GraphProps<T>, value: GraphProps<T>[typeof key]) {
		graph.props[key] = value;
		this.emit("graph-props-updated", {
			graph,
			key,
			value
		});
	}

	//public createSubGraph<T extends Graph<any>>(type: GraphType<T, any>, name: string, props: GraphProps<T>): GraphRef<T> {
	//	assert(() => !this._graphs.all().find(g => g.name === name), `Graph with name ${name} already exists`);
	//	const graph = this._graphs.allocWithId(type, name, props);
	//	const g = new GraphRef(this, graph);
	//	this.emit("graph-added", { graph: g });
	//	return g;
	//}

	public tryCreateGraph<T extends Graph<P>, P extends {}>(type: GraphType<T>, name: string, props: P): Result<T, GraphError> {
		if (this._graphs.all().find(g => g.name === name))
			return Err(GraphError.DuplicateGraphName(name));
		const graph = this._graphs.alloc(type, name, props);

		this.emit("graph-added", { graph });
		return Ok(graph);
	}

	// todo: remove graph?

	// ------------ Node methods ------------
	public addNode<T extends Graph<any>, U extends GraphNodeType<T>, P extends InferNodeProps<U>>(idOrGraph: number | T, type: NodeType<U, P>, props: P): U {
		const graph = typeof idOrGraph === "number" ? this.getGraph(idOrGraph) : idOrGraph;

		if (isNodeType(type, GraphInputNode))
			this.validateGraphInput(graph, (props as any).inputName);

		if (isNodeType(type, SubGraphNode)) {
			const subGraph = this.getGraph((props as any).graph);
			assert(() => subGraph !== graph && !this.hasDependency(subGraph, graph), "Recursive subgraphs are not allowed!");
		}

		const node = graph.addNode(type, props);
		this.emit("node-added", { graph, node })
		return node;
	}

	public tryAddNode<T extends Node<P>, P extends {}>(idOrGraph: number | Graph<any>, type: NodeType<T, P>, props: P): Result<T, GraphError> {
		return Result.try(() => {
			const graph = typeof idOrGraph === "number" ? this.getGraph(idOrGraph) : idOrGraph;

			if (isNodeType(type, GraphInputNode))
				this.validateGraphInput(graph, (props as any).inputName);

			if (isNodeType(type, SubGraphNode)) {
				const subGraph = this.getGraph((props as any).graph);
				assert(() => subGraph !== graph && !this.hasDependency(subGraph, graph), "Recursive subgraphs are not allowed!");
			}

			if (!graph.nodeTypes.includes(type))
				return Err(GraphError.InvalidNodeType(graph, type));


			const node = graph.addNode(type, props as any);
			this.emit("node-added", { graph, node })
			return Ok(node);
		}, GraphError.Error);
	}

	public removeNode<T extends Graph>(graph: T, node: GraphNodeType<T>) {
		const group = graph.getNodeGroup(node.id);

		if (group && this.isGroupIONode(group, node))
			return;

		if (group) {
			group.removeNode(node.id);
			this.emit("group-updated", { group, graph });
		}

		this.removeNodeAt(graph, node.id);
	}

	private removeNodeAt(graph: Graph, index: number) {
		const node = graph.getNode(index);

		if (!node)
			return;

		for (const edge of graph.edges)
			if (edge.source === node.id || edge.target === node.id)
				this.disconnect(graph, edge);

		graph.removeNode(node.id);
		this.emit("node-removed", { node, graph });
	}



	// ------------ Edge methods ------------
	public connect<T extends Graph<any>, Source extends GraphNodeType<T>, Target extends GraphNodeType<T> | GraphOutputNode>(graph: T, source: Source, outputPort: NodeOutputName<Source>, target: Target, inputPort: string): Edge {
		assert(() => source.graphId === graph.id, "Source node belongs to another graph!");
		assert(() => target.graphId === graph.id, "Target node belongs to another graph!");
		assert(() => !this.createsCycle(graph, source, target), "Edge create a cycle!");
		assert(() => outputPort in source.getOutputs(this), `Missing output port ${outputPort.toString()}!`);
		assert(() => inputPort in target.getInputs(this), `Missing input port ${outputPort.toString()}!`);
		assert(() => this.canCrossGroupBoundary(graph, source, target), "Edge crosses a group boundary!");
		const edge = graph.addEdge({
			source: source.id,
			outputPort: outputPort.toString(),
			target: target.id,
			inputPort: inputPort.toString()
		});
		this.emit("edge-added", { edge, graph });
		return edge;
	}

	public tryConnect<T extends Graph<any>, Source extends NodeType<any>, Target extends NodeType<any>>(graph: T, source: InstanceType<Source>, outputPort: string | number | symbol, targetNode: InstanceType<Target> | GraphOutputNode, inputPort: string | number | symbol): Result<Edge, GraphError> {
		const target = targetNode as Node;

		if (source.graphId !== graph.id)
			return Err(GraphError.InvalidNode(graph, source));

		if (target.graphId !== graph.id)
			return Err(GraphError.InvalidNode(graph, target));

		if (this.createsCycle(graph, source, target))
			return Err(GraphError.EdgeCycle());

		if (!(outputPort in source.getOutputs(this)))
			return Err(GraphError.MissingPort(source, "output", outputPort.toString()));

		if (!(inputPort in target.getInputs(this)))
			return Err(GraphError.MissingPort(target, "input", inputPort.toString()));

		if (!this.canCrossGroupBoundary(graph, source, target))
			return Err(GraphError.InvalidGroupBoundary());

		const edge = graph.addEdge({
			source: source.id,
			outputPort: outputPort.toString(),
			target: target.id,
			inputPort: inputPort.toString()
		});

		this.emit("edge-added", { graph, edge });
		return Ok(edge);
	}

	public canConnect<T extends Graph<any>, Source extends NodeType<any>, Target extends NodeType<any>>(graph: T, source: InstanceType<Source>, outputPort: string | number | symbol, targetNode: InstanceType<Target> | GraphOutputNode, inputPort: string | number | symbol): boolean {
		const target = targetNode as Node;

		if (source.graphId !== graph.id)
			return false;

		if (target.graphId !== graph.id)
			return false;

		if (this.createsCycle(graph, source, target))
			return false;

		if (!(outputPort in source.getOutputs(this)))
			return false;

		if (!(inputPort in target.getInputs(this)))
			return false;

		if (!this.canCrossGroupBoundary(graph, source, target))
			return false;

		return true;
	}

	public disconnect(graph: Graph, edge: Edge) {
		graph.removeEdge(edge);
		this.emit("edge-removed", { graph, edge });
	}


	// ------------ Group methods ------------
	public addGroup<T extends Group>(graph: Graph, type: GroupType<T>, name: string, inputProps: GroupInputProps<T>, outputProps: GroupOutputProps<T>, parent?: Group): T {
		const group = graph.addGroup(type, name, inputProps, outputProps, parent);
		this.emit("group-added", { group, graph });
		return group;
	}

	public removeGroup(graph: Graph, group: Group) {
		graph.groups.filter(g => g.parent === group.id).forEach(g => {
			this.removeGroup(graph, g);
		});

		group.nodes.forEach(node => this.removeNodeAt(graph, node));

		graph.removeGroup(group);
		this.emit("group-removed", { group, graph });
	}

	public transferNode<G extends Graph, T extends GraphNodeType<G>>(graph: G, node: T, group: Group | null) {
		const currentGroup = graph.getNodeGroup(node.id);

		if (currentGroup === group)
			return;

		if (currentGroup && this.isGroupIONode(currentGroup, node))
			return;

		for (const edge of graph.edges) {
			if (edge.source === node.id && !this.isGroupWithin(graph, graph.getNodeGroup(edge.target), group))
				return;
			if (edge.target === node.id && !this.isGroupWithin(graph, group, graph.getNodeGroup(edge.source)))
				return;
		}

		if (currentGroup) {
			currentGroup.removeNode(node.id);
			this.emit("group-updated", { group: currentGroup, graph });
		}

		if (group) {
			group.addNode(node.id);
			this.emit("group-updated", { group, graph });
		}
	}

	private isGroupWithin(graph: Graph, group: Group | null, parent: Group | null): boolean {
		if (group && !graph.hasGroup(group))
			return false;

		while (group) {
			if (group === parent)
				return true;
			group = group.parent === null ? null : graph.getGroup(group.parent)!;
		}
		return parent === null;
	}

	private isGroupIONode(group: Group, node: Node): boolean {
		return (group.inputNodeType && (node instanceof group.inputNodeType)) || (group.outputNodeType && (node instanceof group.outputNodeType)) || false;
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

	private createsCycle<T extends Graph<any>>(graph: T, source: Node, target: Node): boolean {
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

	private canCrossGroupBoundary(graph: Graph<any>, source: Node, target: Node): boolean {
		const sourceGroup = graph.groups.find(group => group.nodes.includes(source.id)) ?? null;
		const targetGroup = graph.groups.find(group => group.nodes.includes(target.id)) ?? null;

		if (sourceGroup === targetGroup)
			return true;

		if (targetGroup && target instanceof GroupInputNode && target.props.groupId === targetGroup.id && targetGroup.parent === (sourceGroup?.id ?? null))
			return true;

		if (sourceGroup && source instanceof GroupOutputNode && source.props.groupId === sourceGroup.id && sourceGroup.parent === (targetGroup?.id ?? null))
			return true;

		return false;
	}

	private validateGraphInput(graph: Graph<any>, inputName: string): void {
		assert(() => Object.prototype.hasOwnProperty.call(graph.inputs, inputName), `Graph input "${inputName}" is not declared by graph "${graph.name}"!`);
	}

	public resolvePassInput(graphId: number, inputName: string): PassBufferRef {
		const world = this.worldGraph;
		const passNode = world.nodes.find(node => node instanceof PassNode && node.props.graphId === graphId);

		if (!passNode)
			throw new Error(`Missing PassNode for graph ${graphId}!`);

		const edge = world.edges.find(edge => edge.target === passNode.id && edge.inputPort === inputName);

		if (!edge)
			throw new Error(`Missing connection for pass input "${inputName}" in graph ${graphId}!`);

		const source = world.getNode(edge.source);

		if (!source)
			throw new Error(`Missing source node ${edge.source}!`);

		const ref = source.getOutputs(this)[edge.outputPort];

		if (!ref || typeof ref === "string" || ref.name !== "pass-buffer-ref")
			throw new Error(`Invalid pass buffer connection for input "${inputName}"!`);

		return ref;
	}
}

export type MatchingNodeInputPortNames<Source extends Node, Target extends Node, OutputKey extends NodeOutputName<Target>> = {
	[K in NodeInputName<Source>]: ReturnType<Target["getOutputs"]>[OutputKey] extends ReturnType<Source["getInputs"]>[K] ? K : never;
}[NodeInputName<Source>];

export type SerializedGraphs = SerializedGraph[];

export type GraphEvent = Readonly<{
	graph: Graph;
}>;

export type EdgeEvent = Readonly<{
	graph: Graph;
	edge: Edge;
}>;

export type NodeEvent = Readonly<{
	graph: Graph;
	node: Node;
}>;

export type GroupEvent = Readonly<{
	graph: Graph;
	group: Group;
}>;

export type GraphPropsEvent<T extends Graph<Props>, Props extends {}, K extends keyof Props> = Readonly<{
	graph: Graph<T>;
	key: K;
	value: Props[K];
}>;

export type GraphManagerEvents = Readonly<{
	"graph-added": GraphEvent;
	"graph-removed": GraphEvent;
	"graph-props-updated": GraphPropsEvent<any, any, any>;
	"node-added": NodeEvent;
	"node-removed": NodeEvent;
	"edge-added": EdgeEvent;
	"edge-removed": EdgeEvent;
	"group-added": GroupEvent;
	"group-updated": GroupEvent;
	"group-removed": GroupEvent;
}>;

export type GraphManagerEventName = keyof GraphManagerEvents;

export type GraphManagerEventHandler<T extends GraphManagerEventName = GraphManagerEventName> = (event: GraphManagerEvents[T]) => void | Promise<void>;

export type GraphManagerEventSubscriber = <Event extends GraphManagerEventName>(event: { readonly event: Event, readonly data: GraphManagerEvents[Event] }) => void;
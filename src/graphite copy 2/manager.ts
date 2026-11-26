import { Allocator, assert } from "../utils";
import { Edge } from "./edge";
import { Graph, GraphOutputNode, type GraphIOMap, type GraphProps, type GraphType } from "./graph";
import { InputPort, Node, OutputPort, type NodeInitProps, type NodeType } from "./node";
import { Pass, type PassOutputs, type PassProps } from "./pass";
import { SubGraph, type SubGraphInputs, type SubGraphOutputs, type SubGraphProps } from "./subgraph";
import type { Type } from "./types";
import { World } from "./world";

export class GraphManager {
	private readonly graphs = new Allocator(Graph);
	private readonly nodeAllocators = new Map<Graph, Allocator<Node<any>>>();
	private readonly edgeAllocators = new Map<Graph, Allocator<Edge<any, any, any>>>();

	public readonly worldGraph: World;

	public constructor() {
		this.worldGraph = this.allocGraph(World, { name: "World" });
	}

	private allocGraph<T extends Graph<P>, P extends {}>(type: GraphType<T, P>, props: GraphProps<P>) {
		const graph = this.graphs.allocWithId(type, this, props);
		const nodes = new Allocator(Node);
		this.nodeAllocators.set(graph, nodes);
		this.edgeAllocators.set(graph, new Allocator(Edge));
		nodes.allocWithId(GraphOutputNode, this, graph, { graph });
		return graph;
	}

	public createGraph<T extends Graph<P>, P extends {}>(type: GraphType<T, P>, props: GraphProps<P>): T {
		assert(!(type instanceof World));
		return this.allocGraph(type, props);
	}

	public getGraphOutputNode(graphId: number): GraphOutputNode<any> {
		const graph = assert.notNull(this.graphs.get(graphId));
		const nodes = assert.notNull(this.nodeAllocators.get(graph));
		return nodes.get(0)! as GraphOutputNode<any>;
	}

	// todo: add type checking for valid graph node types
	public addNode<G extends Graph, T extends Node<T, P>, P extends {}>(graph: G, type: NodeType<T, P>, props: NodeInitProps<T, P>): T {
		assert(graph.nodeTypes.includes(type) || (type === GraphInputNode as NodeType<any, any>));
		const nodes = assert.notNull(this.nodeAllocators.get(graph));
		return nodes.allocWithId(type, this, graph, props)!;
	}

	public removeNode(node: Node<any>) {
		const nodes = assert.notNull(this.nodeAllocators.get(node.graph));

		for (const n in node.inputs) {
			const edge = this.getInputEdge(node.inputs[n]!);
			if (edge)
				this.disconnect(edge);
		}

		for (const n in node.outputs) {
			this.getOutputEdges(node.outputs[n]!)?.map(this.disconnect);
		}

		return nodes.free(node.id)!;
	}

	public connect<T extends Type, Source extends OutputPort<any, any, T>, Target extends InputPort<Node<any>, any, T>>(outputPort: Source, inputPort: Target): Edge<T, Source, Target> {
		assert(outputPort.type === inputPort.type);
		assert(outputPort.node !== inputPort.node);
		assert(outputPort.node.graph === inputPort.node.graph);
		const edges = assert.notNull(this.edgeAllocators.get(outputPort.node.graph));
		return edges.allocWithId(Edge, this, outputPort, inputPort) as Edge<T, Source, Target>;
	}

	public disconnect(edge: Edge) {
		const edges = assert.notNull(this.edgeAllocators.get(edge.outputPort.node.graph));
		edges.free(edge.id);
	}

	public getOutputEdges(outputPort: OutputPort<Node<any>, any, any>): Edge[] {
		const edges = assert.notNull(this.edgeAllocators.get(outputPort.node.graph));
		return edges.all().filter(e => e.outputPort === outputPort);
	}

	public getInputEdge(inputPort: InputPort<any, any, any>): Edge | null {
		const edges = assert.notNull(this.edgeAllocators.get(inputPort.node.graph));
		return edges.all().find(e => e.inputPort === inputPort) || null;
	}

	public createPass<I extends GraphIOMap = GraphIOMap, O extends PassOutputs = PassOutputs>(props: GraphProps<PassProps<I, O>>): Pass<I, O> {
		return this.createGraph(Pass, props) as Pass<I, O>;
	}

	public createSubGraph<I extends SubGraphInputs = SubGraphInputs, O extends SubGraphOutputs = SubGraphOutputs>(props: GraphProps<SubGraphProps<I, O>>): SubGraph<I, O> {
		return this.createGraph(SubGraph, props) as SubGraph<I, O>;
	}
}
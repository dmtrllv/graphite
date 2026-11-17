import React, { useEffect, useMemo, useRef } from "react";
import { F16, F32, GraphNode, I32, NodeOption, NodeProp, Type, U32, Vec2, Vec3, Vec4, type NodeOptionType, type TypeCtor } from "../../graph";
import { useObservable } from "../../reactive/hook";
import { mapChildren, stopPropagation } from "../../utils";
import { useEvent, useMouseMove } from "../../hooks";

export const GraphNodeView = ({ node }: { node: GraphNode }) => {
	node = useObservable(node);
	const graph = useObservable(node.graph);

	const { onMouseDown } = useMouseMove(node.position, pos => node.position = pos, 1 / graph.scale, true);

	const inputs = GraphNode.getInputs(node.constructor);
	const options = GraphNode.getOptions(node.constructor);
	const outputs = GraphNode.getOutputs(node.constructor);

	const style = useMemo<React.CSSProperties>(() => {
		return {
			left: `calc(50% + ${node.position.x}px)`,
			top: `calc(50% + ${-node.position.y}px)`,
			transform: `translate(-50%, -50%)`
		}
	}, [node.position.x, node.position.y]);

	return (
		<div className="graph-node" style={style} onMouseDown={stopPropagation}>
			<div className="name" onMouseDown={onMouseDown}>{node.name}</div>
			<div className="body">
				{outputs && (
					mapChildren(outputs, (k, v) => <NodePropView key={k} node={node} prop={v} withOutput={true} />)
				)}
				{options && (
					mapChildren(options, (k, v) => <NodePropView key={k} node={node} prop={v} withInput={v.withInput} />)
				)}
				{inputs && (
					mapChildren(inputs, (k, v) => <NodePropView key={k} node={node} prop={v} withInput={true} />)
				)}
			</div>
		</div>
	);
};

export const NodePropView = ({ node, prop, withInput, withOutput }: NodePropsViewProps) => {
	useObservable(node);

	const inputRef = useRef<HTMLDivElement>(null);
	const outputRef = useRef<HTMLDivElement>(null);

	const p = node[prop.name as keyof typeof node];

	const hasInput = !!node.getInputEdge(prop.name);

	const Input =  NodePropInputs.get(p.constructor as any);

	if (!Input) {
		console.warn(`Missing node prop view for ${p.constructor.name}!`);
		return null;
	}

	useEffect(() => {
		node.inputElements[prop.name] = inputRef.current;
		node.outputElements[prop.name] = outputRef.current;

		return () => {
			if (node.inputElements[prop.name])
				delete node.inputElements[prop.name];
			if (node.outputElements[prop.name])
				delete node.outputElements[prop.name];
		};
	}, []);

	const startDraggingEdge = (from: "input" | "output") => {
		return (e: React.MouseEvent) => {
			node.graph.draggingEdge = {
				from,
				key: prop.name,
				node,
				mousePosition: new Vec2(e.clientX, e.clientY)
			}
		}
	};

	useEvent("mouseup", () => {
		node.graph.draggingEdge = null;
	});

	const endDraggingEdge = () => {
		if (node.graph.draggingEdge && prop.isKeyOf(node))
			node.graph.connectDraggingEdge(node, prop.name);
	};

	return (
		<div className={`option ${prop.getKind(node)}`}>
			{withInput && <div className="input-point" ref={inputRef} onMouseDown={startDraggingEdge("input")} onMouseUp={endDraggingEdge} />}
			<label>{prop.name}</label>
			<Input node={node} name={prop.name} disabled={(!withInput && !withOutput) || hasInput} prop={p} />
			{withOutput && <div className="output-point" ref={outputRef} onMouseDown={startDraggingEdge("output")} onMouseUp={endDraggingEdge} />}
		</div>
	);
};

type NodePropsViewProps = {
	node: GraphNode;
	prop: NodeProp;
	withInput?: boolean;
	withOutput?: boolean;
};

const NodePropInputs = new Map<TypeCtor<any> | NodeOptionType<any, any>, React.FC<NodeInputProps<any>>>();

export function registerNodePropInput<T extends Type>(type: TypeCtor<T> | TypeCtor<T>[], component: React.FC<NodeInputProps<T>>): void;
export function registerNodePropInput<T extends NodeOption<any>>(type: NodeOptionType<T, any> | NodeOptionType<T, any>[], component: React.FC<NodeInputProps<T>>): void;
export function registerNodePropInput<T extends Type>(type: TypeCtor<T> | TypeCtor<T>[], component: React.FC<NodeInputProps<T>>) {
	if (Array.isArray(type))
		return type.forEach(type => registerNodePropInput(type, component));

	NodePropInputs.set(type, component);
};

type NodeInputProps<T extends Type | NodeOption<any>> = {
	readonly name: string;
	readonly prop: T;
	readonly disabled: boolean;
	readonly node: GraphNode;
};

registerNodePropInput([F32, F16, U32, I32], ({ prop, name, disabled }) => {
	return <input type="number" value={prop.value} placeholder={name} disabled={disabled} onChange={e => prop.value = +e.target.value} />
});

registerNodePropInput(Vec2, ({ prop, disabled }) => {
	return (
		<div className="vec2">
			<input type="number" value={prop.x} placeholder="x" disabled={disabled} onChange={e => prop.x = +e.target.value} />
			<input type="number" value={prop.y} placeholder="y" disabled={disabled} onChange={e => prop.y = +e.target.value} />
		</div>
	);
});

registerNodePropInput(Vec3, ({ prop, disabled }) => {
	return (
		<div className="vec3">
			<input type="number" value={prop.x} placeholder="x" disabled={disabled} onChange={e => prop.x = +e.target.value} />
			<input type="number" value={prop.y} placeholder="y" disabled={disabled} onChange={e => prop.y = +e.target.value} />
			<input type="number" value={prop.z} placeholder="z" disabled={disabled} onChange={e => prop.z = +e.target.value} />
		</div>
	);
});

registerNodePropInput(Vec4, ({ prop, disabled }) => {
	return (
		<div className="vec4">
			<input type="number" value={prop.x} placeholder="x" disabled={disabled} onChange={e => prop.x = +e.target.value} />
			<input type="number" value={prop.y} placeholder="y" disabled={disabled} onChange={e => prop.y = +e.target.value} />
			<input type="number" value={prop.z} placeholder="z" disabled={disabled} onChange={e => prop.z = +e.target.value} />
			<input type="number" value={prop.w} placeholder="w" disabled={disabled} onChange={e => prop.w = +e.target.value} />
		</div>
	);
});

registerNodePropInput(Vec4, ({ prop, disabled }) => {
	return (
		<div className="vec4">
			<input type="number" value={prop.x} placeholder="x" disabled={disabled} onChange={e => prop.x = +e.target.value} />
			<input type="number" value={prop.y} placeholder="y" disabled={disabled} onChange={e => prop.y = +e.target.value} />
			<input type="number" value={prop.z} placeholder="z" disabled={disabled} onChange={e => prop.z = +e.target.value} />
			<input type="number" value={prop.w} placeholder="w" disabled={disabled} onChange={e => prop.w = +e.target.value} />
		</div>
	);
});

registerNodePropInput(NodeOption, ({ prop }) => {
	return (
		<select value={prop.value} onChange={e => prop.value = e.target.value}>
			{prop.options.map(option => <option key={option} value={option}>{option}</option>)}
		</select>
	);
});

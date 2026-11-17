import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { F16, F32, GraphNode, I32, NodeOption, NodeProp, SelectOption, Type, U32, Vec2, Vec3, Vec4, type NodeOptionType, type TypeCtor } from "../../graph";
import { useObservable } from "../../reactive/hook";
import { mapChildren, stopPropagation } from "../../utils";
import { useEvent, useMouseMove } from "../../hooks";

export const GraphNodeView = ({ node, onLayoutChange, onLayoutRemove }: {
	node: GraphNode;
	onLayoutChange: (node: GraphNode) => void;
	onLayoutRemove: (node: GraphNode) => void;
}) => {
	node = useObservable(node);

	const graph = useObservable(node.graph);
	const root = useRef<HTMLDivElement>(null);

	const selectedNodePositions = useRef<Vec2[]>([]);

	const { onMouseDown } = useMouseMove(node.position, (pos, offset) => {
		if (node.graph.isSelected(node) && (node.graph.selectedNodes.length > 0)) {
			node.graph.selectedNodes.forEach((n, i) => {
				n.position = selectedNodePositions.current[i]!.clone().add(offset);
			});
		} else {
			node.position = pos;
		}
	}, 1 / graph.scale, true);

	const { inputs, options, outputs } = GraphNode.getInterface(node);

	const style = useMemo<React.CSSProperties>(() => {
		return {
			left: `calc(50% + ${node.position.x}px)`,
			top: `calc(50% + ${-node.position.y}px)`,
			transform: `translate(-50%, -50%)`
		}
	}, [node.position.x, node.position.y]);

	useLayoutEffect(() => {
		onLayoutChange(node);
	}, [node, node.position.x, node.position.y, onLayoutChange]);

	useLayoutEffect(() => {
		return () => onLayoutRemove(node);
	}, [node, onLayoutRemove]);

	useEffect(() => {
		if (!root.current)
			return;

		const observer = new ResizeObserver(() => onLayoutChange(node));
		observer.observe(root.current);

		return () => observer.disconnect();
	}, [node, onLayoutChange]);

	const mouseDown = (e: React.MouseEvent) => {
		if (node.graph.isSelected(node) && (node.graph.selectedNodes.length > 0)) {
			e.stopPropagation();
			selectedNodePositions.current = node.graph.selectedNodes.map(n => n.position.clone());
		}

		onMouseDown(e);
	};

	return (
		<div ref={root} className={`graph-node ${node.graph.isSelected(node) ? "selected" : ""}`} style={style} onMouseDown={stopPropagation}>
			<div className="name" onMouseDown={mouseDown}>{node.name}</div>
			<div className="body">
				{outputs.map(port => <NodePropView key={port.name} node={node} name={port.name} withOutput={true} />)}
				{options.map(option => <NodePropView key={option.name} node={node} name={option.name} />)}
				{inputs.map(port => <NodePropView key={port.name} node={node} name={port.name} withInput={true} />)}
			</div>
		</div>
	);
};

export const NodePropView = ({ node, name, withInput, withOutput }: { node: GraphNode; name: string; withInput?: boolean; withOutput?: boolean; }) => {
	useObservable(node);

	const inputRef = useRef<HTMLDivElement>(null);
	const outputRef = useRef<HTMLDivElement>(null);

	const p = node[name as keyof typeof node];
	const hasInput = withInput && !!node.getInputEdge(name);

	const Input = NodePropInputs.get(p.constructor as any);

	if (!Input) {
		console.warn(`Missing node prop view for ${p.constructor.name}!`);
		return null;
	}

	useLayoutEffect(() => {
		if (withInput)
			node.inputElements[name] = inputRef.current;

		if (withOutput)
			node.outputElements[name] = outputRef.current;

		return () => {
			delete node.inputElements[name];
			delete node.outputElements[name];
		};
	}, []);

	const startDraggingEdge = (from: "input" | "output") => {
		return (e: React.MouseEvent) => {
			node.graph.draggingEdge = {
				from,
				key: name,
				node,
				mousePosition: new Vec2(e.clientX, e.clientY)
			};
		};
	};

	useEvent("mouseup", () => {
		node.graph.draggingEdge = null;
	});

	const endDraggingEdge = () => {
		if (node.graph.draggingEdge)
			node.graph.connectDraggingEdge(node, name);
	};

	return (
		<div className={`option ${node.getPropKind(name)}`}>
			{withInput && <div className="input-point" ref={inputRef} onMouseDown={startDraggingEdge("input")} onMouseUp={endDraggingEdge} />}
			<label>{name}</label>
			<Input node={node} name={name} disabled={!withInput && !withOutput || !!hasInput} prop={p} />
			{withOutput && <div className="output-point" ref={outputRef} onMouseDown={startDraggingEdge("output")} onMouseUp={endDraggingEdge} />}
		</div>
	);
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
			<input type="number" value={disabled ? "" : prop.x} placeholder="x" disabled={disabled} onChange={e => prop.x = +e.target.value} />
			<input type="number" value={disabled ? "" : prop.y} placeholder="y" disabled={disabled} onChange={e => prop.y = +e.target.value} />
		</div>
	);
});

registerNodePropInput(Vec3, ({ prop, disabled }) => {
	return (
		<div className="vec3">
			<input type="number" value={disabled ? "" : prop.x} placeholder="x" disabled={disabled} onChange={e => prop.x = +e.target.value} />
			<input type="number" value={disabled ? "" : prop.y} placeholder="y" disabled={disabled} onChange={e => prop.y = +e.target.value} />
			<input type="number" value={disabled ? "" : prop.z} placeholder="z" disabled={disabled} onChange={e => prop.z = +e.target.value} />
		</div>
	);
});

registerNodePropInput(Vec4, ({ prop, disabled }) => {
	return (
		<div className="vec4">
			<input type="number" value={disabled ? "" : prop.x} placeholder="x" disabled={disabled} onChange={e => prop.x = +e.target.value} />
			<input type="number" value={disabled ? "" : prop.y} placeholder="y" disabled={disabled} onChange={e => prop.y = +e.target.value} />
			<input type="number" value={disabled ? "" : prop.z} placeholder="z" disabled={disabled} onChange={e => prop.z = +e.target.value} />
			<input type="number" value={disabled ? "" : prop.w} placeholder="w" disabled={disabled} onChange={e => prop.w = +e.target.value} />
		</div>
	);
});

registerNodePropInput(SelectOption, ({ prop }) => {
	return (
		<select value={prop.value} onChange={e => prop.value = e.target.value}>
			{prop.options.map(option => <option key={option} value={option}>{option}</option>)}
		</select>
	);
});

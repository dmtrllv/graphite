
import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { F16, F32, GraphNode, I32, NodeOption, SelectOption, Type, U32, Vec2, Vec3, Vec4, type NodeOptionType, type TypeCtor } from "../../graph";
import { useObservable } from "../../reactive/hook";
import { stopPropagation } from "../../utils";
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
		if (node.graph.isSelected(node) && node.graph.selectedNodes.length > 0) {
			node.graph.selectedNodes.forEach((n, i) => {
				n.position = selectedNodePositions.current[i]!.clone().add(offset);
			});
		} else {
			node.position = pos;
		}
	}, 1 / graph.scale, true);

	const { inputs, options, outputs } = GraphNode.getInterface(node);

	const optionOutputNames = new Map<string, readonly string[]>();
	const attachedOutputs = new Set<string>();

	for (const option of options) {
		const value = node[option.name as keyof typeof node] as unknown as NodeOption<string>;
		const names = option.variants[value.value]?.outputs ?? [];

		optionOutputNames.set(option.name, names);
		names.forEach(name => attachedOutputs.add(name));
	}

	const style = useMemo<React.CSSProperties>(() => {
		return {
			left: `calc(50% + ${node.position.x}px)`,
			top: `calc(50% + ${-node.position.y}px)`,
			transform: "translate(-50%, -50%)"
		};
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
		if (node.graph.isSelected(node) && node.graph.selectedNodes.length > 0) {
			e.stopPropagation();
			selectedNodePositions.current = node.graph.selectedNodes.map(n => n.position.clone());
		}

		onMouseDown(e);
	};

	return (
		<div ref={root} className={`graph-node ${node.graph.isSelected(node) ? "selected" : ""}`} style={style} onMouseDown={stopPropagation}>
			<div className="name" onMouseDown={mouseDown}>{node.name}</div>
			<div className="body">
				{options.map(option => (
					<NodePropView
						key={option.name}
						node={node}
						name={option.name}
						outputNames={optionOutputNames.get(option.name) ?? []}
					/>
				))}
				{outputs.filter(port => !attachedOutputs.has(port.name)).map(port => (
					<NodePropView key={port.name} node={node} name={port.name} withOutput />
				))}
				{inputs.map(port => (
					<NodePropView key={port.name} node={node} name={port.name} withInput />
				))}
			</div>
		</div>
	);
};

export const NodePropView = ({ node, name, withInput, withOutput, outputNames }: {
	node: GraphNode;
	name: string;
	withInput?: boolean;
	withOutput?: boolean;
	outputNames?: readonly string[];
}) => {
	useObservable(node);

	const inputRef = useRef<HTMLDivElement>(null);
	const prop = node[name as keyof typeof node];
	const hasInput = withInput && !!node.getInputEdge(name);
	const exposedOutputs = outputNames ?? (withOutput ? [name] : []);
	const showInput = !withOutput || !!withInput;
	const Input = NodePropInputs.get(prop.constructor as any);

	const outputRefs = useRef(new Map<string, (element: HTMLDivElement | null) => void>());

	const getOutputRef = (key: string) => {
		let ref = outputRefs.current.get(key);

		if (!ref) {
			ref = element => {
				if (element)
					node.outputElements[key] = element;
				else
					delete node.outputElements[key];
			};

			outputRefs.current.set(key, ref);
		}

		return ref;
	};

	useLayoutEffect(() => {
		if (withInput)
			node.inputElements[name] = inputRef.current;

		return () => {
			if (withInput)
				delete node.inputElements[name];
		};
	}, [node, name, withInput]);

	const startDraggingEdge = (from: "input" | "output", key: string) => {
		return (e: React.MouseEvent) => {
			node.graph.draggingEdge = {
				from,
				key,
				node,
				mousePosition: new Vec2(e.clientX, e.clientY)
			};
		};
	};

	const endDraggingEdge = (key: string) => {
		if (node.graph.draggingEdge)
			node.graph.connectDraggingEdge(node, key);
	};

	useEvent("mouseup", () => {
		node.graph.draggingEdge = null;
	});

	if (showInput && !Input) {
		console.warn(`Missing node prop view for ${prop.constructor.name}!`);
		return null;
	}

	return (
		<div className={`option ${node.getPropKind(name)}`}>
			{withInput && (
				<div
					className="input-point"
					ref={inputRef}
					onMouseDown={startDraggingEdge("input", name)}
					onMouseUp={() => endDraggingEdge(name)}
				/>
			)}
			<label>{name}</label>
			{showInput && Input && (
				<Input
					node={node}
					name={name}
					disabled={!!hasInput}
					prop={prop}
				/>
			)}
			{exposedOutputs.map(outputName => (
				<div
					key={outputName}
					className="output-point"
					ref={getOutputRef(outputName)}
					onMouseDown={startDraggingEdge("output", outputName)}
					onMouseUp={() => endDraggingEdge(outputName)}
				/>
			))}
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
	return <input type="number" value={prop.value} placeholder={name} disabled={disabled} onChange={e => prop.value = +e.target.value} />;
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


import React, { useLayoutEffect, useRef } from "react";
import { F16, F32, GraphNode, I32, NodeOption, SelectOption, Type, U32, Vec2, Vec3, Vec4, type NodeOptionType, type TypeCtor } from "../../graph";
import { useObservable } from "../../reactive/hook";
import { useEvent } from "../../hooks";

type NodePropViewProps = {
	node: GraphNode;
	name: string;
	withInput?: boolean;
	withOutput?: boolean;
	outputNames?: readonly string[];
};

export const NodePropView = ({ node, name, withInput, withOutput, outputNames }: NodePropViewProps) => {
	useObservable(node);

	const inputRef = useRef<HTMLDivElement>(null);
	const prop = node[name as keyof typeof node];
	const hasInput = withInput && !!node.getInputEdge(name);
	const exposedOutputs = outputNames ?? (withOutput ? [name] : []);
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

	if (!Input) {
		console.warn(`Missing node prop view for ${prop.constructor.name}!`);
		return null;
	}

	return (
		<div className={`option ${node.getPropKind(name)}`}>
			{withInput && (
				<div className={`input-point ${node.getPropKind(name)}`} ref={inputRef} onMouseDown={startDraggingEdge("input", name)} onMouseUp={() => endDraggingEdge(name)} />
			)}
			<label>{name}</label>
			{Input && (
				<Input node={node} name={name} disabled={!!hasInput} prop={prop} />
			)}
			{exposedOutputs.map(outputName => (
				<div key={outputName} className={`output-point ${node.getPropKind(outputName)}`} ref={getOutputRef(outputName)} onMouseDown={startDraggingEdge("output", outputName)} onMouseUp={() => endDraggingEdge(outputName)} />
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

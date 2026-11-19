import { Bool, F16, F32, GraphNode, I32, SelectOption, SubgraphNode, Type, U32, Vec2, Vec3, Vec4, type NodeOption, type NodeOptionType, type TypeCtor, GraphEditor } from "@editor";
import React, { useCallback, useRef } from "react";
import { useObservable } from "@reactive";
import type { GraphLayout } from "./rendering";
import { Toggle } from "../../inputs/toggle";

type NodePropViewProps = {
	node: GraphNode;
	editor: GraphEditor;
	layout: GraphLayout;
	name: string;
	portKey?: string;
	value?: Type;
	withInput?: boolean;
	withOutput?: boolean;
	outputNames?: readonly string[];
	outputTypes: ReadonlyMap<string, Type>;
};

export const NodePropView = ({ node, editor, layout, name, portKey = name, value, withInput, withOutput, outputNames, outputTypes }: NodePropViewProps) => {
	const isSubgraphNode = node instanceof SubgraphNode;

	const inputRef = useCallback((element: HTMLDivElement | null) => {
		if (withInput)
			layout.setPortElement(node, "input", portKey, element);
	}, [node, layout, portKey, withInput]);

	const prop = useObservable(value ?? node[name as keyof typeof node] as any);
	const hasInput = withInput && !!node.getInputEdge(portKey);
	const exposedOutputs = outputNames ?? (withOutput ? [portKey] : []);
	const Input = NodePropInputs.get(prop.constructor as any);
	const outputRefs = useRef(new Map<string, (element: HTMLDivElement | null) => void>());

	const getOutputRef = (key: string) => {
		let ref = outputRefs.current.get(key);

		if (!ref) {
			ref = element => layout.setPortElement(node, "output", key, element);
			outputRefs.current.set(key, ref);
		}

		return ref;
	};

	const startDraggingEdge = (from: "input" | "output", key: string) => (event: React.PointerEvent) => {
		event.preventDefault();
		event.stopPropagation();

		const root = event.currentTarget.closest(".graph-renderer");
		const canvas = root?.querySelector("canvas");

		if (root instanceof HTMLElement)
			root.setPointerCapture(event.pointerId);

		if (canvas instanceof HTMLCanvasElement)
			layout.updateNode(node, editor.graph, canvas);

		editor.beginEdgeDrag(from, node, key, new Vec2(event.clientX, event.clientY));
		layout.setHoveredPort({ node, direction: from, key });
	};

	if (!Input) {
		console.warn(`Missing node prop view for ${prop.constructor.name}!`);
		return null;
	}

	return (
		<div className={`option ${prop.kind}`}>
			{withInput && (
				<div className={`input-point ${prop.kind}`} ref={inputRef} onPointerDown={startDraggingEdge("input", portKey)} />
			)}
			<label>{name}</label>
			{!isSubgraphNode && <Input node={node} name={name} disabled={!!hasInput} prop={prop} />}
			{exposedOutputs.map(outputName => (
				<div key={outputName} className={`output-point ${outputTypes.get(outputName)?.kind ?? ""}`} ref={getOutputRef(outputName)} onPointerDown={startDraggingEdge("output", outputName)} />
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
}

type NodeInputProps<T extends Type | NodeOption<any>> = {
	readonly name: string;
	readonly prop: T;
	readonly disabled: boolean;
	readonly node: GraphNode;
};

registerNodePropInput(Bool, ({ prop, disabled }) => (
	<Toggle value={prop.value} onChange={v => prop.value = v} disabled={disabled} />
));

registerNodePropInput([F32, F16, U32, I32], ({ prop, name, disabled }) => (
	<input type="number" value={prop.value} placeholder={name} disabled={disabled} onChange={e => prop.value = +e.target.value} />
));

registerNodePropInput(Vec2, ({ prop, disabled }) => (
	<div className="vec2">
		<input type="number" value={disabled ? "" : prop.x} placeholder="x" disabled={disabled} onChange={e => prop.x = +e.target.value} />
		<input type="number" value={disabled ? "" : prop.y} placeholder="y" disabled={disabled} onChange={e => prop.y = +e.target.value} />
	</div>
));

registerNodePropInput(Vec3, ({ prop, disabled }) => (
	<div className="vec3">
		<input type="number" value={disabled ? "" : prop.x} placeholder="x" disabled={disabled} onChange={e => prop.x = +e.target.value} />
		<input type="number" value={disabled ? "" : prop.y} placeholder="y" disabled={disabled} onChange={e => prop.y = +e.target.value} />
		<input type="number" value={disabled ? "" : prop.z} placeholder="z" disabled={disabled} onChange={e => prop.z = +e.target.value} />
	</div>
));

registerNodePropInput(Vec4, ({ prop, disabled }) => (
	<div className="vec4">
		<input type="number" value={disabled ? "" : prop.x} placeholder="x" disabled={disabled} onChange={e => prop.x = +e.target.value} />
		<input type="number" value={disabled ? "" : prop.y} placeholder="y" disabled={disabled} onChange={e => prop.y = +e.target.value} />
		<input type="number" value={disabled ? "" : prop.z} placeholder="z" disabled={disabled} onChange={e => prop.z = +e.target.value} />
		<input type="number" value={disabled ? "" : prop.w} placeholder="w" disabled={disabled} onChange={e => prop.w = +e.target.value} />
	</div>
));

registerNodePropInput(SelectOption, ({ prop }) => (
	<select value={prop.value} onChange={e => prop.value = e.target.value}>
		{prop.options.map(option => <option key={option} value={option}>{option}</option>)}
	</select>
));

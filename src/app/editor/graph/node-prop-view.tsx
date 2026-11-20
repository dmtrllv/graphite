import { GraphNode, SelectOption, type NodeOption, type NodeOptionType, type TypeCtor, GraphEditor } from "@editor/graph";
import { Bool, F16, F32, I32, Type, U32, Vec2, Vec3, Vec4 } from "@editor/graph/types";
import type { GraphLayout } from "@editor/graph/renderer";
import React, { useCallback, useRef } from "react";
import { useObservable } from "@reactive";
import { Toggle } from "../../inputs/toggle";
import { Vec2Input, Vec3Input, Vec4Input } from "../../inputs/vector";

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
	hideInputElement?: boolean;
};

export const NodePropView = ({ node, editor, layout, name, portKey = name, value, withInput, withOutput, outputNames, outputTypes, hideInputElement }: NodePropViewProps) => {
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
			layout.updateNode(node, editor, canvas);

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
			{hideInputElement ? <label>{name}</label> : <Input node={node} name={name} disabled={!!hasInput} value={prop} />}
			{exposedOutputs.map(outputName => (
				<div key={outputName} className={`output-point ${outputTypes.get(outputName)?.kind ?? ""}`} ref={getOutputRef(outputName)} onPointerDown={startDraggingEdge("output", outputName)} />
			))}
		</div>
	);
};

export const NodePropInputs = new Map<TypeCtor<any> | NodeOptionType<any, any>, React.FC<NodeInputProps<any>>>();

export function registerNodePropInput<T extends Type>(type: TypeCtor<T> | TypeCtor<T>[], component: React.FC<NodeInputProps<T>>): void;
export function registerNodePropInput<T extends NodeOption<any>>(type: NodeOptionType<T, any> | NodeOptionType<T, any>[], component: React.FC<NodeInputProps<T>>): void;
export function registerNodePropInput<T extends Type>(type: TypeCtor<T> | TypeCtor<T>[], component: React.FC<NodeInputProps<T>>) {
	if (Array.isArray(type))
		return type.forEach(type => registerNodePropInput(type, component));

	NodePropInputs.set(type, component);
}

type NodeInputProps<T extends Type | NodeOption<any>> = {
	readonly name: string;
	readonly value: T;
	readonly disabled: boolean;
	readonly node: GraphNode;
};

registerNodePropInput(Bool, ({ name, value, disabled }) => (
	<Toggle label={name} value={value.value} onChange={v => value.value = v} disabled={disabled} />
));

registerNodePropInput([F32, F16, U32, I32], ({ value, name, disabled }) => (
	<>
		<label>{name}</label>
		<input type="number" value={value.value} placeholder={name} disabled={disabled} onChange={e => value.value = +e.target.value} />
	</>
));

registerNodePropInput(Vec2, Vec2Input);
registerNodePropInput(Vec3, Vec3Input);
registerNodePropInput(Vec4, Vec4Input);

registerNodePropInput(SelectOption, ({ name, value }) => (
	<>
		<label>{name}</label>
		<select value={value.value} onChange={e => value.value = e.target.value}>
			{value.options.map(option => <option key={option} value={option}>{option}</option>)}
		</select>
	</>
));

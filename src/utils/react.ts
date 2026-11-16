
import type { JSX } from "react/jsx-runtime";

export const mapChildren: MapChildrenFn = (obj: any, mapper: any) => {
	let index = 0;

	if(obj instanceof Map)
		return Array.from(obj, ([k, v]) => mapper(k, v, index++));

	if(obj instanceof Set)
		return Array.from(obj, (v) => mapper(v, index++));

	if(Array.isArray(obj))
		return obj.map((v) => mapper(v, index++));

	return Object.keys(obj).map(k => mapper(k, obj[k], index++));
}

interface MapChildrenFn {
	<K, V>(map: Map<K, V>, mapper: (key: K, value: V, index: number) => JSX.Element): JSX.Element[];
	<V>(set: Set<V>, mapper: (value: V, index: number) => JSX.Element): JSX.Element[];
	<V>(arr: Array<V>, mapper: (value: V, index: number) => JSX.Element): JSX.Element[];
	<T extends object>(object: T, mapper: <K extends keyof T>(key: K, value: T[K], index: number) => JSX.Element): JSX.Element[];
}

export const stopPropagation = (e: React.UIEvent) => {
	e.stopPropagation();
};

export const stopDefault = (e: React.UIEvent) => {
	e.preventDefault();
};
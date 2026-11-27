import React from "react";
import type { JSX } from "react/jsx-runtime";

const withKey = (el: JSX.Element, key: string | number) => {
	return React.createElement(React.Fragment, { key: key.toString() }, el);
};

export const mapChildren: MapChildrenFn = (obj: any, mapper: any) => {
	let index = 0;

	if (obj instanceof Map)
		return Array.from(obj.entries().map(([k, v]) => withKey(mapper(k, v, index++), k)));

	if (obj instanceof Set)
		return Array.from(obj, (v) => {
			const key = index++;
			return withKey(mapper(v, key), key);
		});

	if (Array.isArray(obj))
		return obj.map((v) => {
			const key = index++;
			return withKey(mapper(v, key), key);
		});

	return Object.keys(obj).map(key => withKey(mapper(obj[key], key, index++), key));
}

interface MapChildrenFn {
	<K extends string | number, V>(map: Map<K, V>, mapper: (value: V, key: K, index: number) => (JSX.Element | null)): (JSX.Element | null)[];
	<V>(set: Set<V>, mapper: (value: V, index: number) => (JSX.Element | null)): (JSX.Element | null)[];
	<V>(arr: Array<V>, mapper: (value: V, index: number) => (JSX.Element | null)): (JSX.Element | null)[];
	<T extends object>(object: T, mapper: <K extends keyof T>(value: T[K], key: K, index: number) => (JSX.Element | null)): (JSX.Element | null)[];
}

export const stopPropagation = (e: React.UIEvent) => {
	e.stopPropagation();
};

export const stopDefault = (e: React.UIEvent) => {
	e.preventDefault();
};

export const cn = (className: string, props: Record<string, string | number | boolean | undefined | null>, ...additional: (string | null | undefined)[]) => {
	const names = [className, ...additional.filter(a => !!a?.trim())];
	for(const k in props) {
		const value = props[k];
		if(value === true) {
			names.push(k);
		} else if(typeof value === "number" || typeof value === "string") {
			names.push(`${k}-${value}`);
		}
	}
	return names.join(" ");
};
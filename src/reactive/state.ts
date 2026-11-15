import { immutable } from "../utils";
import type { ChangeEvent, Unsubscriber } from "./types";

export type ChangeHandler = (event: any) => boolean | void;

type Registration = {
	key: string;
	recursive: boolean;
	handler: ChangeHandler;
};

export type ObservableState = {
	observables: Set<string>;
	subscribers: Registration[];
	interceptors: Registration[];
};

const STATES = new WeakMap<object, ObservableState>();

export const getState = (target: object, create: boolean = false): ObservableState => {
	let state = STATES.get(target);

	if (!state) {
		if (!create)
			throw new Error(`${target.constructor.name} is not observable!`);

		state = {
			observables: new Set(),
			subscribers: [],
			interceptors: []
		};

		STATES.set(target, state);
	}

	return state;
};

export const markObservable = (target: object, key: string): void => {
	getState(target, true).observables.add(key);
};

export const assertObservable = (target: object, key: string | string[]): void => {
	if (Array.isArray(key)) {
		key.forEach((k) => assertObservable(target, k));
		return;
	}

	const root = key.split(".")[0];

	if (!root)
		throw new Error(`observable key cannot be empty!`);

	if (!getState(target).observables.has(root))
		throw new Error(`${target.constructor.name}.${root} is not observable!`);
};

export const register = (target: object, type: "subscribers" | "interceptors", key: string | string[], recursive: boolean, handler: ChangeHandler): Unsubscriber => {
	if (Array.isArray(key)) {
		const unsubscribers = key.map(k => register(target, type, k, recursive, handler));
		return () => unsubscribers.forEach(fn => fn());
	}
	
	const registrations = getState(target, true)[type];
	const registration = { key, recursive, handler };

	registrations.push(registration);

	return () => {
		const index = registrations.indexOf(registration);

		if (index === -1)
			throw new Error(`${target.constructor.name}.${key} is already unsubscribed!`);

		registrations.splice(index, 1);
	};
};

export const createEvent = <K extends string, V>(key: K, oldValue: V, newValue: V): ChangeEvent<any, any> => {
	return immutable({ key, oldValue, newValue }) as ChangeEvent<any, any>;
};

const matches = (registration: Registration, key: string): boolean => registration.key === key || (registration.recursive && (!registration.key || key.startsWith(`${registration.key}.`)));

export const runInterceptors = (target: object, event: ChangeEvent<any, any>): boolean => {
	const state = getState(target);

	for (const registration of [...state.interceptors]) {
		if (matches(registration, event.key) && registration.handler(event) === false)
			return false;
	}

	return true;
};

export const notify = (target: object, event: ChangeEvent<any, any>): void => {
	const state = getState(target);

	for (const registration of [...state.subscribers]) {
		if (matches(registration, event.key))
			registration.handler(event);
	}
};

type Dependencies = Map<object, Set<string>>;

const TRACKERS: Dependencies[] = [];

export const trackDependency = (target: object, key: string): void => {
	const dependencies = TRACKERS.at(-1);

	if (!dependencies)
		return;

	let keys = dependencies.get(target);

	if (!keys) {
		keys = new Set();
		dependencies.set(target, keys);
	}

	keys.add(key);
};

export const trackDependencies = (dependencies: Dependencies): void => {
	const current = TRACKERS.at(-1);

	if (!current)
		return;

	for (const [target, keys] of dependencies) {
		let currentKeys = current.get(target);

		if (!currentKeys) {
			currentKeys = new Set();
			current.set(target, currentKeys);
		}

		for (const key of keys)
			currentKeys.add(key);
	}
};

export const collectDependencies = <T>(callback: () => T): { value: T; dependencies: Dependencies } => {
	const dependencies: Dependencies = new Map();

	TRACKERS.push(dependencies);

	try {
		return { value: callback(), dependencies };
	} finally {
		TRACKERS.pop();
	}
};
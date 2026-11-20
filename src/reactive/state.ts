export interface ObservableEvent {
	target: object;
	source: object;
	key: string;
	path: string;
	paths: readonly string[];
	oldValue: unknown;
	newValue: unknown;
	operation?: Readonly<Record<string, unknown>>;
}

export type ObservableSubscriber = (event: ObservableEvent) => void;
export type ObservableInterceptor = (event: ObservableEvent) => boolean | void;

type SubscriberRegistration = {
	callback: ObservableSubscriber;
	recursive: boolean;
};

type InterceptorRegistration = {
	callback: ObservableInterceptor;
	recursive: boolean;
};

type ParentLink = {
	parent: object;
	child: object;
	segment: string;
};

type ObservableState = {
	subscribers: Set<SubscriberRegistration>;
	interceptors: Set<InterceptorRegistration>;
	parents: Set<ParentLink>;
	children: Map<string, ParentLink>;
	propertyListeners: Map<string, Set<() => void>>;
	version: number;
};

type DependencyCollection = {
	dependencies: Map<object, Set<string>>;
};

const STATES = new WeakMap<object, ObservableState>();
const OBSERVABLE_CLASSES = new WeakSet<Function>();
const TRACKERS: DependencyCollection[] = [];

export const markObservableClass = (type: Function): void => {
	OBSERVABLE_CLASSES.add(type);
};

export const isObservableInstance = (value: unknown): value is object => {
	if (!value || typeof value !== "object")
		return false;

	const prototype = Object.getPrototypeOf(value);

	return !!prototype && OBSERVABLE_CLASSES.has(prototype.constructor);
};

export const ensureState = (target: object): ObservableState => {
	if (!isObservableInstance(target))
		throw new TypeError(`${(target as any).constructor.name} is not decorated with @observable!`);

	let state = STATES.get(target);

	if (!state) {
		state = {
			subscribers: new Set(),
			interceptors: new Set(),
			parents: new Set(),
			children: new Map(),
			propertyListeners: new Map(),
			version: 0
		};

		STATES.set(target, state);
	}

	return state;
};

export const getState = (target: object): ObservableState => {
	const state = STATES.get(target);

	if (!state)
		return ensureState(target);

	return state;
};

export const getVersion = (target: object): number => getState(target).version;

export const createEvent = (source: object, key: string, oldValue: unknown, newValue: unknown, operation?: Readonly<Record<string, unknown>>): ObservableEvent => Object.freeze({
	target: source,
	source,
	key,
	path: key,
	paths: Object.freeze([key]),
	oldValue,
	newValue,
	...(operation ? { operation } : {})
});

const createScopedEvent = (event: ObservableEvent, target: object, paths: string[]): Readonly<ObservableEvent> => {
	const frozenPaths = Object.freeze(paths);

	return Object.freeze({
		...event,
		target,
		key: frozenPaths[0],
		path: frozenPaths[0],
		paths: frozenPaths
	}) as Readonly<ObservableEvent>;
};

const collectRoutes = (source: object, key: string): Map<object, Set<string>> => {
	const routes = new Map<object, Set<string>>();

	const visit = (target: object, path: string, ancestors: Set<object>): void => {
		let paths = routes.get(target);

		if (!paths) {
			paths = new Set();
			routes.set(target, paths);
		}

		paths.add(path);

		for (const link of getState(target).parents) {
			if (ancestors.has(link.parent))
				continue;

			const nextAncestors = new Set(ancestors);
			nextAncestors.add(link.parent);

			visit(link.parent, `${link.segment}.${path}`, nextAncestors);
		}
	};

	visit(source, key, new Set([source]));

	return routes;
};

export const dispatchBeforeChange = (source: object, event: ObservableEvent): boolean => {
	for (const [target, paths] of collectRoutes(source, event.key)) {
		const state = getState(target);
		const scopedEvent = createScopedEvent(event, target, [...paths]);

		for (const registration of [...state.interceptors]) {
			if (target !== source && !registration.recursive)
				continue;

			if (registration.callback(scopedEvent) === false)
				return false;
		}
	}

	return true;
};

export const dispatchChange = (source: object, event: ObservableEvent): void => {
	const propertyListeners = getState(source).propertyListeners.get(event.key);

	if (propertyListeners) {
		for (const listener of [...propertyListeners])
			listener();
	}

	for (const [target, paths] of collectRoutes(source, event.key)) {
		const state = getState(target);
		const scopedEvent = createScopedEvent(event, target, [...paths]);

		state.version++;

		for (const registration of [...state.subscribers]) {
			if (target !== source && !registration.recursive)
				continue;

			registration.callback(scopedEvent);
		}
	}
};

export const setChild = (parent: object, segment: string, value: unknown): void => {
	const state = ensureState(parent);
	const previous = state.children.get(segment);

	if (previous?.child === value)
		return;

	if (previous) {
		getState(previous.child).parents.delete(previous);
		state.children.delete(segment);
	}

	if (!isObservableInstance(value))
		return;

	const link: ParentLink = { parent, child: value, segment };

	state.children.set(segment, link);
	ensureState(value).parents.add(link);
};

export const removeChild = (parent: object, segment: string): void => {
	const state = ensureState(parent);
	const previous = state.children.get(segment);

	if (!previous)
		return;

	getState(previous.child).parents.delete(previous);
	state.children.delete(segment);
};

export const syncChildren = (parent: object, entries: Iterable<readonly [string, unknown]>): void => {
	const state = ensureState(parent);

	for (const link of state.children.values())
		getState(link.child).parents.delete(link);

	state.children.clear();

	for (const [segment, value] of entries)
		setChild(parent, segment, value);
};

export const registerSubscriber = (
	target: object,
	callback: ObservableSubscriber,
	recursive = false
): (() => void) => {
	const registration: SubscriberRegistration = { callback, recursive };

	getState(target).subscribers.add(registration);

	return () => getState(target).subscribers.delete(registration);
};

export const registerInterceptor = (
	target: object,
	callback: ObservableInterceptor,
	recursive = false
): (() => void) => {
	const registration: InterceptorRegistration = { callback, recursive };

	getState(target).interceptors.add(registration);

	return () => getState(target).interceptors.delete(registration);
};

export const subscribeProperty = (
	target: object,
	key: string,
	callback: () => void
): (() => void) => {
	const state = getState(target);
	let listeners = state.propertyListeners.get(key);

	if (!listeners) {
		listeners = new Set();
		state.propertyListeners.set(key, listeners);
	}

	listeners.add(callback);

	return () => {
		listeners!.delete(callback);

		if (!listeners!.size)
			state.propertyListeners.delete(key);
	};
};

export const trackDependency = (target: object, key: string): void => {
	const tracker = TRACKERS.at(-1);

	if (!tracker)
		return;

	let keys = tracker.dependencies.get(target);

	if (!keys) {
		keys = new Set();
		tracker.dependencies.set(target, keys);
	}

	keys.add(key);
};

export const collectDependencies = <T>(callback: () => T): {
	value: T;
	dependencies: Map<object, Set<string>>;
} => {
	const tracker: DependencyCollection = { dependencies: new Map() };

	TRACKERS.push(tracker);

	try {
		return {
			value: callback(),
			dependencies: tracker.dependencies
		};
	} finally {
		TRACKERS.pop();
	}
};

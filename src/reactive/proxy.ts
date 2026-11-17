import { createEvent, getState, markObservable, notify, runInterceptors, trackDependency } from "./state";

type ProxyRoute = {
	path: string;
	ancestors: Set<object>;
};

type ProxyAssociation = {
	owner: object;
	routes: ProxyRoute[];
	recursive: boolean;
};

type ProxyEntry = {
	proxy: object;
	associations: ProxyAssociation[];
};

const PROXY_TARGETS = new WeakMap<object, object>();
const PROXY_CACHE = new WeakMap<object, ProxyEntry>();

export const toRaw = <T>(value: T): T => (value !== null && typeof value === "object" ? PROXY_TARGETS.get(value as object) ?? value : value) as T;

export const getProxyRoutes = (value: object): { owner: object; path: string }[] | undefined => {
	const target = PROXY_TARGETS.get(value);

	if (!target)
		return;

	const entry = PROXY_CACHE.get(target);

	if (!entry)
		return;

	return entry.associations.flatMap(association =>
		association.routes.map(route => ({
			owner: association.owner,
			path: route.path
		}))
	);
};

const isObservableObject = (value: unknown): value is object => {
	return value !== null && typeof value === "object" && (Object.prototype.toString.call(value) === "[object Object]" || Array.isArray(value) || value instanceof Map || value instanceof Set);
};

const joinPath = (base: string, key: string): string => base ? key ? `${base}.${key}` : base : key;

const getAssociation = (entry: ProxyEntry, owner: object, recursive: boolean): ProxyAssociation => {
	let association = entry.associations.find(value => value.owner === owner);

	if (!association) {
		association = {
			owner,
			routes: [],
			recursive
		};

		entry.associations.push(association);
	} else {
		association.recursive ||= recursive;
	}

	return association;
};

const addRoute = (association: ProxyAssociation, path: string, ancestors: Set<object>): void => {
	if (association.routes.some(route => route.path === path))
		return;

	association.routes.push({ path, ancestors });
};

const createProxyInternal = (target: object, owner: object, path: string, recursive: boolean, ancestors: Set<object>): object => {
	target = toRaw(target);
	owner = toRaw(owner);

	if (!path) {
		getState(owner, true);

		for (const key of Object.keys(target))
			markObservable(owner, key);
	}

	let entry = PROXY_CACHE.get(target);

	if (entry) {
		addRoute(getAssociation(entry, owner, recursive), path, ancestors);
		return entry.proxy;
	}

	entry = {
		proxy: null as any,
		associations: []
	};

	addRoute(getAssociation(entry, owner, recursive), path, ancestors);
	PROXY_CACHE.set(target, entry);

	const getPaths = (key: string): { owner: object; key: string }[] => {
		return entry!.associations.flatMap(association =>
			association.routes.map(route => ({
				owner: association.owner,
				key: joinPath(route.path, key)
			}))
		);
	};

	const wrap = (value: any, key: string, samePath: boolean = false): any => {
		if (!isObservableObject(value))
			return value;

		const raw = toRaw(value);
		let proxy: object | undefined;

		for (const association of [...entry!.associations]) {
			if (!association.recursive)
				continue;

			for (const route of [...association.routes]) {
				if (route.ancestors.has(raw))
					continue;

				const nextAncestors = new Set(route.ancestors);
				nextAncestors.add(raw);

				proxy = createProxyInternal(
					raw,
					association.owner,
					samePath ? route.path : joinPath(route.path, key),
					association.recursive,
					nextAncestors
				);
			}
		}

		return proxy ?? PROXY_CACHE.get(raw)?.proxy ?? value;
	};

	const emit = (key: string, previous: any, value: any, mutate: () => any): any => {
		const events = getPaths(key).map(({ owner, key }) => ({
			owner,
			event: createEvent(key, previous, value)
		}));

		for (const { owner, event } of events) {
			if (!runInterceptors(owner, event))
				return false;
		}

		const result = mutate();

		for (const { owner, event } of events)
			notify(owner, event);

		return result;
	};

	const track = (k: string) => {
		for (const { owner, key } of getPaths(k))
			trackDependency(owner, key);
	};

	const wrapIterator = <T, R>(iterator: IterableIterator<T>, mapper: (value: T) => R): IterableIterator<R> => {
		return (function* () {
			for (const value of iterator)
				yield mapper(value);
		})();
	};

	const proxy = new Proxy(target, {
		get(target, property, receiver) {
			if (target instanceof Map) {
				if (property === "size") {
					track("");
					return target.size;
				}

				if (property === "get")
					return (mapKey: any) => {
						const rawKey = toRaw(mapKey);
						const key = String(rawKey);

						track(key);

						return wrap(target.get(rawKey), key);
					};

				if (property === "has")
					return (mapKey: any) => {
						const rawKey = toRaw(mapKey);

						track(String(rawKey));

						return target.has(rawKey);
					};

				if (property === "set")
					return (mapKey: any, next: any) => {
						const rawKey = toRaw(mapKey);
						const value = toRaw(next);
						const key = String(rawKey);
						const previous = target.get(rawKey);

						if (target.has(rawKey) && Object.is(previous, value))
							return receiver;

						emit(key, previous, value, () => target.set(rawKey, value));

						return receiver;
					};

				if (property === "delete")
					return (mapKey: any) => {
						const rawKey = toRaw(mapKey);

						if (!target.has(rawKey))
							return false;

						const key = String(rawKey);
						const previous = target.get(rawKey);

						return emit(key, previous, undefined, () => target.delete(rawKey)) !== false;
					};

				if (property === "clear")
					return () => {
						if (!target.size)
							return;

						emit("", new Map(target), undefined, () => target.clear());
					};

				if (property === "keys")
					return () => {
						track("");
						return target.keys();
					};

				if (property === "values")
					return () => {
						track("");

						return wrapIterator(
							target.entries(),
							([key, value]) => wrap(value, String(key))
						);
					};

				if (property === "entries" || property === Symbol.iterator)
					return () => {
						track("");

						return wrapIterator(
							target.entries(),
							([key, value]) => [key, wrap(value, String(key))] as [any, any]
						);
					};

				if (property === "forEach")
					return (callback: Function, thisArg?: any) => {
						track("");

						target.forEach((value, key) => {
							callback.call(thisArg, wrap(value, String(key)), key, receiver);
						});
					};

				return Reflect.get(target, property, target);
			}

			if (target instanceof Set) {
				if (property === "size") {
					track("");
					return target.size;
				}

				if (property === "has")
					return (next: any) => {
						track("");
						return target.has(toRaw(next));
					};

				if (property === "add")
					return (next: any) => {
						const value = toRaw(next);

						if (target.has(value))
							return receiver;

						emit("", undefined, value, () => target.add(value));

						return receiver;
					};

				if (property === "delete")
					return (next: any) => {
						const value = toRaw(next);

						if (!target.has(value))
							return false;

						return emit("", value, undefined, () => target.delete(value)) !== false;
					};

				if (property === "clear")
					return () => {
						if (!target.size)
							return;

						emit("", new Set(target), undefined, () => target.clear());
					};

				if (property === "keys" || property === "values" || property === Symbol.iterator)
					return () => {
						track("");

						return wrapIterator(
							target.values(),
							value => wrap(value, "", true)
						);
					};

				if (property === "entries")
					return () => {
						track("");

						return wrapIterator(
							target.entries(),
							([value]) => {
								const wrapped = wrap(value, "", true);
								return [wrapped, wrapped] as [any, any];
							}
						);
					};

				if (property === "forEach")
					return (callback: Function, thisArg?: any) => {
						track("");

						target.forEach(value => {
							const wrapped = wrap(value, "", true);
							callback.call(thisArg, wrapped, wrapped, receiver);
						});
					};

				return Reflect.get(target, property, target);
			}

			if (typeof property === "symbol")
				return Reflect.get(target, property, target);

			const key = String(property);

			track(key);

			return wrap(Reflect.get(target, property, target), key);
		},

		set(target, property, next) {
			if (typeof property === "symbol")
				return Reflect.set(target, property, toRaw(next), target);

			const key = String(property);
			const previous = Reflect.get(target, property, target);
			const value = toRaw(next);

			if (Object.is(previous, value))
				return true;

			for (const association of entry!.associations) {
				if (association.routes.some(route => !route.path) && !getState(association.owner, true).observables.has(key))
					markObservable(association.owner, key);
			}

			return emit(key, previous, value, () => Reflect.set(target, property, value, target)) !== false;
		},

		deleteProperty(target, property) {
			if (!Reflect.has(target, property))
				return true;

			const key = String(property);
			const previous = Reflect.get(target, property, target);

			return emit(key, previous, undefined, () => Reflect.deleteProperty(target, property)) !== false;
		}
	});

	entry.proxy = proxy;
	PROXY_TARGETS.set(proxy, target);

	return proxy;
};

export const createProxy = (target: object, owner: object, path: string, recursive: boolean = true): object => {
	target = toRaw(target);

	return createProxyInternal(target, owner, path, recursive, new Set([target]));
};

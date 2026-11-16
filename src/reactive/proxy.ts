
import { createEvent, getState, markObservable, notify, runInterceptors, trackDependency } from "./state";

const PROXY_TARGETS = new WeakMap<object, object>();
const PROXY_CACHE = new WeakMap<object, WeakMap<object, object>>();

export const toRaw = <T>(value: T): T => (value !== null && typeof value === "object" ? PROXY_TARGETS.get(value as object) ?? value : value) as T;

const isObservableObject = (value: unknown): value is object => {
	return value !== null && typeof value === "object" && (Object.prototype.toString.call(value) === "[object Object]" || Array.isArray(value) || value instanceof Map || value instanceof Set);
};

const joinPath = (base: string, key: string): string => base ? key ? `${base}.${key}` : base : key;

export const createProxy = (target: object, owner: object, path: string, recursive: boolean = true): object => {
	target = toRaw(target);

	let cache = PROXY_CACHE.get(owner);

	if (!cache) {
		cache = new WeakMap();
		PROXY_CACHE.set(owner, cache);
	}

	const cached = cache.get(target) as any;
	
	if (cached) {
		cached.paths.add(path);
		return cached.proxy;
	}

	const paths = new Set<string>([path]);

	if (!path) {
		getState(owner, true);

		for (const key of Object.keys(target))
			markObservable(owner, key);
	}

	const getPaths = (key: string): string[] => {
		return [...paths].map(path => joinPath(path, key));
	};

	const wrap = (value: any, keys: string[]): any => {
		if (!recursive || !isObservableObject(value))
			return value;

		let proxy: object | undefined;

		for (const key of keys)
			proxy = createProxy(value, owner, key, recursive);

		return proxy;
	};

	const emit = (key: string, previous: any, value: any, mutate: () => any): any => {
		const events = getPaths(key).map(key => createEvent(key, previous, value));

		for (const event of events) {
			if (!runInterceptors(owner, event))
				return false;
		}

		const result = mutate();

		for (const event of events)
			notify(owner, event);

		return result;
	};

	const track = (key: string) => {
		for (const path of getPaths(key))
			trackDependency(owner, path);
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

						return wrap(target.get(rawKey), getPaths(key));
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

						const result = emit(key, previous, value, () => target.set(rawKey, value));

						return result === false ? receiver : receiver;
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
							([key, value]) => wrap(value, getPaths(String(key)))
						);
					};

				if (property === "entries" || property === Symbol.iterator)
					return () => {
						track("");

						return wrapIterator(
							target.entries(),
							([key, value]) => [key, wrap(value, getPaths(String(key)))] as [any, any]
						);
					};

				if (property === "forEach")
					return (callback: Function, thisArg?: any) => {
						track("");

						target.forEach((value, key) => {
							callback.call(thisArg, wrap(value, getPaths(String(key))), key, receiver);
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
							value => wrap(value, [...paths])
						);
					};

				if (property === "entries")
					return () => {
						track("");

						return wrapIterator(
							target.entries(),
							([value]) => {
								const wrapped = wrap(value, [...paths]);
								return [wrapped, wrapped] as [any, any];
							}
						);
					};

				if (property === "forEach")
					return (callback: Function, thisArg?: any) => {
						track("");

						target.forEach(value => {
							const wrapped = wrap(value, [...paths]);
							callback.call(thisArg, wrapped, wrapped, receiver);
						});
					};

				return Reflect.get(target, property, target);
			}

			if (typeof property === "symbol")
				return Reflect.get(target, property, target);

			const key = String(property);

			track(key);

			return wrap(Reflect.get(target, property, target), getPaths(key));
		},

		set(target, property, next) {
			if (typeof property === "symbol")
				return Reflect.set(target, property, toRaw(next), target);

			const key = String(property);
			const previous = Reflect.get(target, property, target);
			const value = toRaw(next);

			if (Object.is(previous, value))
				return true;

			if (paths.has("") && !getState(owner).observables.has(key))
				markObservable(owner, key);

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

	PROXY_TARGETS.set(proxy, target);
	cache.set(target, { proxy, paths } as any);

	return proxy;
};

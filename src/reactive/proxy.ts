
import { createEvent, getState, markObservable, notify, runInterceptors, trackDependency } from "./state";

const PROXY_TARGETS = new WeakMap<object, object>();

export const toRaw = <T>(value: T): T => (value !== null && typeof value === "object" ? PROXY_TARGETS.get(value as object) ?? value : value) as T;

const isObservableObject = (value: unknown): value is object => {
	return value !== null && typeof value === "object" && (Object.prototype.toString.call(value) === "[object Object]" || Array.isArray(value) || value instanceof Map || value instanceof Set);
};

export const createProxy = (target: object, owner: object, root: string, path: string, cache: WeakMap<object, Map<string, object>>, recursive: boolean = true): object => {
	if (PROXY_TARGETS.has(target))
		return target;
	
	let paths = cache.get(target);

	if (!paths) {
		paths = new Map();
		cache.set(target, paths);
	}

	const cached = paths.get(path);

	if (cached)
		return cached;

	if (!path) {
		getState(owner, true);

		for (const key of Object.keys(target))
			markObservable(owner, key);
	}

	const wrap = (value: any, key: string): any => {
		if (!recursive || !isObservableObject(value))
			return value;

		return createProxy(value, owner, root || key, key, cache, recursive);
	};

	const emit = (key: string, previous: any, value: any, mutate: () => any): any => {
		const event = createEvent(key, previous, value);

		if (!runInterceptors(owner, event))
			return false;

		const result = mutate();

		notify(owner, event);

		return result;
	};

	const track = (key: string) => trackDependency(owner, key);

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
					track(path);
					return target.size;
				}

				if (property === "get")
					return (mapKey: any) => {
						const rawKey = toRaw(mapKey);
						const key = `${path}.${String(rawKey)}`;

						track(key);

						return wrap(target.get(rawKey), key);
					};

				if (property === "has")
					return (mapKey: any) => {
						const rawKey = toRaw(mapKey);

						track(`${path}.${String(rawKey)}`);

						return target.has(rawKey);
					};

				if (property === "set")
					return (mapKey: any, next: any) => {
						const rawKey = toRaw(mapKey);
						const value = toRaw(next);
						const key = `${path}.${String(rawKey)}`;
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

						const key = `${path}.${String(rawKey)}`;
						const previous = target.get(rawKey);

						return emit(key, previous, undefined, () => target.delete(rawKey)) !== false;
					};

				if (property === "clear")
					return () => {
						if (!target.size)
							return;

						emit(path, new Map(target), undefined, () => target.clear());
					};

				if (property === "keys")
					return () => {
						track(path);
						return target.keys();
					};

				if (property === "values")
					return () => {
						track(path);

						return wrapIterator(
							target.entries(),
							([key, value]) => wrap(value, `${path}.${String(key)}`)
						);
					};

				if (property === "entries" || property === Symbol.iterator)
					return () => {
						track(path);

						return wrapIterator(
							target.entries(),
							([key, value]) => [key, wrap(value, `${path}.${String(key)}`)] as [any, any]
						);
					};

				if (property === "forEach")
					return (callback: Function, thisArg?: any) => {
						track(path);

						target.forEach((value, key) => {
							callback.call(thisArg, wrap(value, `${path}.${String(key)}`), key, receiver);
						});
					};

				return Reflect.get(target, property, target);
			}

			if (target instanceof Set) {
				if (property === "size") {
					track(path);
					return target.size;
				}

				if (property === "has")
					return (next: any) => {
						track(path);
						return target.has(toRaw(next));
					};

				if (property === "add")
					return (next: any) => {
						const value = toRaw(next);

						if (target.has(value))
							return receiver;

						emit(path, undefined, value, () => target.add(value));

						return receiver;
					};

				if (property === "delete")
					return (next: any) => {
						const value = toRaw(next);

						if (!target.has(value))
							return false;

						return emit(path, value, undefined, () => target.delete(value)) !== false;
					};

				if (property === "clear")
					return () => {
						if (!target.size)
							return;

						emit(path, new Set(target), undefined, () => target.clear());
					};

				if (property === "keys" || property === "values" || property === Symbol.iterator)
					return () => {
						track(path);

						return wrapIterator(
							target.values(),
							value => wrap(value, path)
						);
					};

				if (property === "entries")
					return () => {
						track(path);

						return wrapIterator(
							target.entries(),
							([value]) => {
								const wrapped = wrap(value, path);
								return [wrapped, wrapped] as [any, any];
							}
						);
					};

				if (property === "forEach")
					return (callback: Function, thisArg?: any) => {
						track(path);

						target.forEach(value => {
							const wrapped = wrap(value, path);
							callback.call(thisArg, wrapped, wrapped, receiver);
						});
					};

				return Reflect.get(target, property, target);
			}

			if (typeof property === "symbol")
				return Reflect.get(target, property, target);

			const key = path ? `${path}.${String(property)}` : String(property);

			track(key);

			return wrap(Reflect.get(target, property, target), key);
		},

		set(target, property, next) {
			if (typeof property === "symbol")
				return Reflect.set(target, property, toRaw(next), target);

			const key = path ? `${path}.${String(property)}` : String(property);
			const previous = Reflect.get(target, property, target);
			const value = toRaw(next);

			if (Object.is(previous, value))
				return true;

			if (!path && !getState(owner).observables.has(key))
				markObservable(owner, key);

			const event = createEvent(key, previous, value);

			if (!runInterceptors(owner, event))
				return true;

			const result = Reflect.set(target, property, value, target);

			if (result)
				notify(owner, event);

			return result;
		},

		deleteProperty(target, property) {
			if (!Reflect.has(target, property))
				return true;

			const key = path ? `${path}.${String(property)}` : String(property);
			const previous = Reflect.get(target, property, target);
			const event = createEvent(key, previous, undefined);

			if (!runInterceptors(owner, event))
				return true;

			const result = Reflect.deleteProperty(target, property);

			if (result)
				notify(owner, event);

			return result;
		}
	});

	PROXY_TARGETS.set(proxy, target);
	paths.set(path, proxy);

	return proxy;
};


import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { getState, register } from "./state";
import { createProxy, toRaw } from "./proxy";
import type { Interceptor, ObservableOptions, RecursiveInterceptor, RecursiveKey, RecursiveSubscriber, SubscribeOptions, Subscriber } from "./types";
import { subscribe } from "./subscribe";
import { intercept } from "./intercept";

type Store = {
	version: number;
	listeners: Set<() => void>;
};

const STORES = new WeakMap<object, Store>();

const getStore = (target: object): Store => {
	let store = STORES.get(target);

	if (!store) {
		store = {
			version: 0,
			listeners: new Set()
		};

		STORES.set(target, store);
	}

	return store;
};

export const useObservable = <T extends object>(value: T | (() => T), options: ObservableOptions = { recursive: true }): T => {
	const [target] = useState(() => {
		value = typeof value === "function" ? value() : value;
		try {
			if (getState(value).observables.size > 0)
				return value;
		} catch { }

		return createProxy(value, value, "", "", new WeakMap(), options.recursive) as T;
	});

	const store = getStore(toRaw(target));

	const subscribeToStore = useCallback((listener: () => void) => {
		const update = () => {
			store.version++;
			listener();
		};

		const state = getState(toRaw(target));
		const unsubscribers: (() => void)[] = [];

		for (const key of state.observables) {
			unsubscribers.push(
				register(toRaw(target), "subscribers", key, true, update)
			);
		}

		return () => {
			for (const unsubscribe of unsubscribers)
				unsubscribe();
		};
	}, [store, target]);

	const getSnapshot = useCallback(() => store.version, [store]);

	useSyncExternalStore(subscribeToStore, getSnapshot, getSnapshot);

	return target;
};

export interface SubscribeHook {
	<T extends object, K extends RecursiveKey<T>>(obj: T, key: K, subscriber: Subscriber<T, K>): void;
	<T extends object, K extends RecursiveKey<T>>(obj: T, key: K, options: SubscribeOptions & { recursive: true }, subscriber: RecursiveSubscriber<T, K>): void;
}

export const useSubscribe: SubscribeHook = (target: any, key: any, callbackOrOptions: any, optionsOrCallback?: any) => {
	const options = typeof callbackOrOptions === "function" ? optionsOrCallback : callbackOrOptions;
	const callback = typeof callbackOrOptions === "function" ? callbackOrOptions : optionsOrCallback;

	useEffect(() => {
		return subscribe(target, key, options, callback);
	}, [target, key, options, callback]);
};

export interface InterceptHook {
	<T extends object, K extends RecursiveKey<T>>(obj: T, key: K, interceptor: Interceptor<T, K>): void;
	<T extends object, K extends RecursiveKey<T>>(obj: T, key: K, options: SubscribeOptions & { recursive: true }, interceptor: RecursiveInterceptor<T, K>): void;
}

export const useIntercept: InterceptHook = (target: any, key: any, callbackOrOptions: any, optionsOrCallback?: any) => {
	const options = typeof callbackOrOptions === "function" ? optionsOrCallback : callbackOrOptions;
	const callback = typeof callbackOrOptions === "function" ? callbackOrOptions : optionsOrCallback;

	useEffect(() => {
		return intercept(target, key, options, callback);
	}, [target, key, options, callback]);
};

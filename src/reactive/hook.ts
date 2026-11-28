import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { ensureState, getVersion, type ObservableSubscriber, type ObservableInterceptor } from "./state";
import { intercept, type InterceptOptions } from "./intercept";
import { subscribe, type SubscribeOptions } from "./subscribe";

export interface ObservableOptions {
	recursive?: boolean;
}

export const useObservable = <T extends object>(value: T | (() => T), options: ObservableOptions = {}): T => {
	const target = useMemo(() => typeof value === "function" ? value() : value as T, [value]);
	
	const recursive = options.recursive ?? false;
	
	ensureState(target);

	const subscribeStore = useCallback(
		(listener: () => void) => subscribe(target, { recursive }, listener),
		[target, recursive]
	);

	const getSnapshot = useCallback(() => getVersion(target), [target]);

	useSyncExternalStore(subscribeStore, getSnapshot, getSnapshot);

	return target;
};

export const useSubscribe = <T extends object>(target: T, callback: ObservableSubscriber, options: SubscribeOptions = {}): void => {
	useEffect(() => subscribe(target, options, callback), [target, callback, options.recursive]);
};

export const useIntercept = <T extends object>(target: T, callback: ObservableInterceptor, options: InterceptOptions = {}): void => {
	useEffect(() => intercept(target, options, callback), [target, callback, options.recursive]);
};

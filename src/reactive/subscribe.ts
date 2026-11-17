import type { SubscriberDecorator, SubscribeFn, SubscribeOptions } from "./types";
import { assertObservable, getState, register, type ChangeHandler } from "./state";
import { getProxyRoutes, toRaw } from "./proxy";

export const subscribe: SubscribeFn = ((target, keyOrOptionsOrSubscriber, optionsOrSubscriber, callback) => {
	const obj = toRaw(target);

	if (typeof keyOrOptionsOrSubscriber === "string" || Array.isArray(keyOrOptionsOrSubscriber)) {
		const key = keyOrOptionsOrSubscriber;
		const options: SubscribeOptions = typeof optionsOrSubscriber === "function" ? {} : optionsOrSubscriber ?? {};
		const subscriber = callback ?? optionsOrSubscriber;

		assertObservable(obj, key);

		return register(obj, "subscribers", key, !!options.recursive, subscriber);
	}

	const options: SubscribeOptions = typeof keyOrOptionsOrSubscriber === "function" ? {} : keyOrOptionsOrSubscriber ?? {};
	const subscriber: any = typeof keyOrOptionsOrSubscriber === "function" ? keyOrOptionsOrSubscriber : optionsOrSubscriber;

	const routes = getProxyRoutes(target) ?? (() => {
		const state = getState(obj);

		if (!state.observables.size)
			throw new Error(`${obj.constructor.name} is not observable!`);

		return [{ owner: obj, path: "" }];
	})();

	const unsubscribers = routes.map(({ owner, path }) => {
		if (path)
			assertObservable(owner, path);

		const handler: ChangeHandler = event => {
			const key = path && event.key.startsWith(`${path}.`) ? event.key.slice(path.length + 1) : event.key === path ? "" : event.key;
			subscriber({ ...event, key } as any);
		};

		return register(owner, "subscribers", path, !!options.recursive, handler);
	});

	return () => {
		for (const unsubscribe of unsubscribers)
			unsubscribe();
	};
}) as SubscribeFn;

export const subscriber: SubscriberDecorator = <K extends string, O extends SubscribeOptions | undefined = undefined>(key: K, options?: O) => {
	return <This extends object>(value: (this: This, event: O extends { recursive: true } ? any : any) => void, context: ClassMethodDecoratorContext<This>) => {
		context.addInitializer(function (this: This) {
			register(this, "subscribers", key, !!options?.recursive, event => value.call(this, event));
		});
	};
};
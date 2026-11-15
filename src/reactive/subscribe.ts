import type { SubscriberDecorator, SubscribeFn, SubscribeOptions } from "./types";
import { assertObservable, register } from "./state";
import { toRaw } from "./proxy";

export const subscribe: SubscribeFn = ((target, key, optionsOrSubscriber, callback) => {
	const options: SubscribeOptions = typeof optionsOrSubscriber === "function" ? {} : optionsOrSubscriber ?? {};
	const subscriber = callback ?? optionsOrSubscriber;
	const obj = toRaw(target);

	assertObservable(obj, key);

	return register(obj, "subscribers", key, !!options.recursive, subscriber);
}) as SubscribeFn;

export const subscriber: SubscriberDecorator = <K extends string, O extends SubscribeOptions | undefined = undefined>(key: K, options?: O) => {
	return <This extends object>(value: (this: This, event: O extends { recursive: true } ? any : any) => void, context: ClassMethodDecoratorContext<This>) => {
		context.addInitializer(function (this: This) {
			register(this, "subscribers", key, !!options?.recursive, event => value.call(this, event));
		});
	};
};
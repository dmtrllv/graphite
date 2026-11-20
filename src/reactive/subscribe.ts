import { ensureState, registerSubscriber, type ObservableEvent, type ObservableSubscriber } from "./state";

export interface SubscribeOptions {
	recursive?: boolean;
}

export type Unsubscribe = () => void;

export function subscribe<T extends object>(target: T, callback: ObservableSubscriber): Unsubscribe;

export function subscribe<T extends object>(target: T, options: SubscribeOptions, callback: ObservableSubscriber): Unsubscribe;

export function subscribe<T extends object>(target: T, optionsOrCallback: SubscribeOptions | ObservableSubscriber, callback?: ObservableSubscriber): Unsubscribe {
	ensureState(target);

	const options = typeof optionsOrCallback === "function" ? {} : optionsOrCallback;
	const subscriber = typeof optionsOrCallback === "function" ? optionsOrCallback : callback;

	if (!subscriber)
		throw new TypeError("A subscriber callback is required!");

	return registerSubscriber(target, subscriber, options.recursive ?? false);
}

export function subscriber<This extends object>(method: (this: This, event: ObservableEvent) => void, context: ClassMethodDecoratorContext<This, (this: This, event: ObservableEvent) => void>): void {
	if (context.kind !== "method")
		throw new TypeError("@subscriber can only decorate methods!");

	context.addInitializer(function (this: This) {
		subscribe(this, method.bind(this));
	});
}

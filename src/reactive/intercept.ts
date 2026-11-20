import { ensureState, registerInterceptor, type ObservableEvent, type ObservableInterceptor } from "./state";
import type { Unsubscribe } from "./subscribe";

export interface InterceptOptions {
	recursive?: boolean;
}

export function intercept<T extends object>(
	target: T,
	callback: ObservableInterceptor
): Unsubscribe;

export function intercept<T extends object>(
	target: T,
	options: InterceptOptions,
	callback: ObservableInterceptor
): Unsubscribe;

export function intercept<T extends object>(
	target: T,
	optionsOrCallback: InterceptOptions | ObservableInterceptor,
	callback?: ObservableInterceptor
): Unsubscribe {
	ensureState(target);

	const options = typeof optionsOrCallback === "function" ? {} : optionsOrCallback;
	const interceptor = typeof optionsOrCallback === "function" ? optionsOrCallback : callback;

	if (!interceptor)
		throw new TypeError("An interceptor callback is required!");

	return registerInterceptor(target, interceptor, options.recursive ?? false);
}

export function interceptor<This extends object>(
	method: (this: This, event: ObservableEvent) => boolean | void,
	context: ClassMethodDecoratorContext<This, (this: This, event: ObservableEvent) => boolean | void>
): void {
	if (context.kind !== "method")
		throw new TypeError("@interceptor can only decorate methods!");

	context.addInitializer(function (this: This) {
		intercept(this, method.bind(this));
	});
}

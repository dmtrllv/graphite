import type { InterceptFn, InterceptorDecorator, SubscribeOptions } from "./types";
import { assertObservable, register } from "./state";
import { toRaw } from "./proxy";

export const intercept: InterceptFn = ((objOrKey: object | string, keyOrOptions?: any, optionsOrInterceptor?: any, callback?: any) => {
	if (typeof objOrKey === "string") {
		const key = objOrKey;
		const options: SubscribeOptions = keyOrOptions ?? {};

		return (value: Function, context: ClassMethodDecoratorContext) => {
			context.addInitializer(function (this: any) {
				register(this, "interceptors", key, !!options.recursive, event => value.call(this, event));
			});
		};
	}

	const obj = toRaw(objOrKey);
	const key = keyOrOptions as string;
	const options: SubscribeOptions = typeof optionsOrInterceptor === "function" ? {} : optionsOrInterceptor ?? {};
	const interceptor = callback ?? optionsOrInterceptor;

	assertObservable(obj, key);

	return register(obj, "interceptors", key, !!options.recursive, interceptor);
}) as InterceptFn;

export const interceptor: InterceptorDecorator = ((key: string, options?: SubscribeOptions) =>
	(value: Function, context: ClassMethodDecoratorContext) => {
		context.addInitializer(function (this: any) {
			register(this, "interceptors", key, !!options?.recursive, event => value.call(this, event));
		});
	}) as InterceptorDecorator;
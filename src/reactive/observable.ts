import type { ObservableOptions } from "./types";
import { createEvent, runInterceptors, notify, trackDependency, getState, markObservable } from "./state";
import { createProxy, toRaw } from "./proxy";

type ObservableDecorator = {
	(options?: ObservableOptions): <This extends object, Value>(value: ClassAccessorDecoratorTarget<This, Value>, context: ClassAccessorDecoratorContext<This, Value>) => ClassAccessorDecoratorResult<This, Value>;
	<This extends object, Value>(value: ClassAccessorDecoratorTarget<This, Value>, context: ClassAccessorDecoratorContext<This, Value>): ClassAccessorDecoratorResult<This, Value>;
};

const decorate = <This extends object, Value>(value: ClassAccessorDecoratorTarget<This, Value>, context: ClassAccessorDecoratorContext<This, Value>, options: ObservableOptions) => {
	const key = context.name.toString();
	const caches = new WeakMap<object, WeakMap<object, Map<string, object>>>();

	return {
		get(this: This) {
			getState(this, true);
			markObservable(this, key);
			trackDependency(this, key);

			const current = value.get.call(this);

			if (!options.recursive || current === null || typeof current !== "object")
				return current;

			let cache = caches.get(this);

			if (!cache) {
				cache = new WeakMap();
				caches.set(this, cache);
			}

			return createProxy(current, this, key, key, cache);
		},
		set(this: This, next: Value) {
			getState(this, true);
			markObservable(this, key);

			const previous = value.get.call(this);
			const current = toRaw(next);

			if (Object.is(previous, current))
				return;

			const event = createEvent<typeof key, Value>(key, previous, current);

			if (!runInterceptors(this, event))
				return;

			value.set.call(this, current);
			notify(this, event);
		},
		init(this: This, initial: Value) {
			return toRaw(initial);
		}
	};
};

export const observable: ObservableDecorator = ((valueOrOptions: any, context?: ClassAccessorDecoratorContext) => {
	if (context)
		return decorate(valueOrOptions, context, { recursive: true });

	const options = valueOrOptions ?? { recursive: true };

	return (value: any, context: ClassAccessorDecoratorContext) => decorate(value, context, options);
}) as ObservableDecorator;
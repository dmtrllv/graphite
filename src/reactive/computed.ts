import type { ComputedOptions } from "./types";
import { collectDependencies, trackDependencies, register, markObservable, createEvent, notify } from "./state";

type ComputedMethod<This extends object, Value> = (this: This) => Value;

type ComputedDecorator = {
	<This extends object, Value>(value: ComputedMethod<This, Value>, context: ClassGetterDecoratorContext<This, Value>): ComputedMethod<This, Value>;
	(options?: ComputedOptions): <This extends object, Value>(value: ComputedMethod<This, Value>, context: ClassGetterDecoratorContext<This, Value>) => ComputedMethod<This, Value>;
};

type ComputedState<Value> = {
	value: Value;
	initialized: boolean;
	dirty: boolean;
	dependencies: Map<object, Set<string>>;
	unsubscribers: (() => void)[];
};

const decorate = <This extends object, Value>(
	value: ComputedMethod<This, Value>,
	context: ClassGetterDecoratorContext<This, Value>,
	options: ComputedOptions
): ComputedMethod<This, Value> => {
	const key = context.name.toString();
	const caches = new WeakMap<This, ComputedState<Value>>();

	const evaluate = (target: This, state: ComputedState<Value>): Value => {
		for (const unsubscribe of state.unsubscribers)
			unsubscribe();

		const result = collectDependencies(() => value.call(target));

		state.value = result.value;
		state.dependencies = result.dependencies;
		state.unsubscribers = [];
		state.initialized = true;
		state.dirty = false;

		for (const [dependency, keys] of result.dependencies) {
			for (const dependencyKey of keys) {
				state.unsubscribers.push(register(
					dependency,
					"subscribers",
					dependencyKey,
					false,
					() => invalidate(target, state)
				));
			}
		}

		trackDependencies(result.dependencies);

		return result.value;
	};

	const invalidate = (target: This, state: ComputedState<Value>): void => {
		if (state.dirty)
			return;

		const previous = state.value;
		state.dirty = true;

		if (!state.initialized)
			return;

		const current = evaluate(target, state);

		if (!Object.is(previous, current))
			notify(target, createEvent(key, previous, current));
	};

	context.addInitializer(function (this: This) {
		markObservable(this, key);
		caches.set(this, {
			value: undefined as Value,
			initialized: false,
			dirty: true,
			dependencies: new Map(),
			unsubscribers: []
		});
	});

	return function (this: This): Value {
		const state = caches.get(this);

		if (!state)
			throw new Error(`${this.constructor.name}.${key} is not initialized!`);

		if (!state.initialized || state.dirty)
			return evaluate(this, state);

		trackDependencies(state.dependencies);

		return state.value;
	};
};

export const computed: ComputedDecorator = ((valueOrOptions: any, context?: ClassGetterDecoratorContext) => {
	if (context)
		return decorate(valueOrOptions, context, {});

	const options = valueOrOptions ?? {};

	return (value: any, context: ClassGetterDecoratorContext) =>
		decorate(value, context, options);
}) as ComputedDecorator;
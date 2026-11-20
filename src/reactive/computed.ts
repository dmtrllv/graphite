import {
	collectDependencies,
	dispatchChange,
	createEvent,
	ensureState,
	subscribeProperty,
	trackDependency
} from "./state";

type ComputedGetter<This extends object, Value> = (this: This) => Value;

type ComputedState<Value> = {
	value: Value;
	initialized: boolean;
	dirty: boolean;
	computing: boolean;
	unsubscribers: (() => void)[];
};

const decorate = <This extends object, Value>(
	getter: ComputedGetter<This, Value>,
	context: ClassGetterDecoratorContext<This, Value>
): ComputedGetter<This, Value> => {
	const key = String(context.name);
	const caches = new WeakMap<This, ComputedState<Value>>();

	const evaluate = (target: This, state: ComputedState<Value>): Value => {
		if (state.computing)
			throw new Error(`Circular computed dependency detected at '${key}'!`);

		state.computing = true;

		for (const unsubscribe of state.unsubscribers)
			unsubscribe();

		state.unsubscribers = [];

		try {
			const result = collectDependencies(() => getter.call(target));

			state.value = result.value;
			state.initialized = true;
			state.dirty = false;

			for (const [dependency, keys] of result.dependencies) {
				for (const dependencyKey of keys) {
					state.unsubscribers.push(subscribeProperty(
						dependency,
						dependencyKey,
						() => invalidate(target, state)
					));
				}
			}

			return result.value;
		} finally {
			state.computing = false;
		}
	};

	const invalidate = (target: This, state: ComputedState<Value>): void => {
		if (state.dirty || !state.initialized || state.computing)
			return;

		const previous = state.value;

		state.dirty = true;

		const current = evaluate(target, state);

		if (!Object.is(previous, current))
			dispatchChange(target, createEvent(target, key, previous, current));
	};

	context.addInitializer(function (this: This) {
		ensureState(this);

		caches.set(this, {
			value: undefined as Value,
			initialized: false,
			dirty: true,
			computing: false,
			unsubscribers: []
		});
	});

	return function (this: This): Value {
		ensureState(this);
		trackDependency(this, key);

		const state = caches.get(this);

		if (!state)
			throw new Error(`Computed property '${key}' is not initialized!`);

		if (!state.initialized || state.dirty)
			return evaluate(this, state);

		return state.value;
	};
};

export function computed<This extends object, Value>(
	getter: ComputedGetter<This, Value>,
	context: ClassGetterDecoratorContext<This, Value>
): ComputedGetter<This, Value>;

export function computed(): <This extends object, Value>(
	getter: ComputedGetter<This, Value>,
	context: ClassGetterDecoratorContext<This, Value>
) => ComputedGetter<This, Value>;

export function computed(
	getter?: ComputedGetter<any, any>,
	context?: ClassGetterDecoratorContext
): any {
	if (context)
		return decorate(getter!, context);

	return (value: ComputedGetter<any, any>, decoratorContext: ClassGetterDecoratorContext) =>
		decorate(value, decoratorContext);
}

import { createEvent, dispatchBeforeChange, dispatchChange, ensureState, markObservableClass, setChild, trackDependency } from "./state";

export function observable<T extends abstract new (...args: any[]) => any>(value: T, context: ClassDecoratorContext): T;

export function observable<This, Value>(
	value: ClassAccessorDecoratorTarget<This, Value>,
	context: ClassAccessorDecoratorContext<This, Value>
): ClassAccessorDecoratorResult<This, Value>;

export function observable(value: any, context: ClassDecoratorContext | ClassAccessorDecoratorContext): any {
	if (context.kind === "class") {
		markObservableClass(value);
		return value;
	}

	const key = String(context.name);

	context.addInitializer(function (this: any) {
		ensureState(this);
		setChild(this, key, value.get.call(this));
	});

	return {
		get(this: object) {
			trackDependency(this, key);
			return value.get.call(this);
		},
		set(this: object, next: unknown) {
			const previous = value.get.call(this);

			if (Object.is(previous, next))
				return;

			const event = createEvent(this, key, previous, next);

			if (!dispatchBeforeChange(this, event))
				return;

			value.set.call(this, next);
			setChild(this, key, next);
			dispatchChange(this, event);
		}
	};
}

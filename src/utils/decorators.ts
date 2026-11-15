export interface AccessorDecorator<T = any, V = any> {
	<This extends T, Value extends V>(value: ClassAccessorDecoratorTarget<This, Value>, context: ClassAccessorDecoratorContext<This, Value>): ClassAccessorDecoratorResult<This, Value>;
}
export interface WrappedAccessorDecorator<This, Value> {
	(value: ClassAccessorDecoratorTarget<This, Value>, context: ClassAccessorDecoratorContext<This, Value>): ClassAccessorDecoratorResult<This, Value>;
}

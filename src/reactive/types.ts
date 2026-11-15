import type { DeepImmutable, Immutable } from "../utils";

export type Unsubscriber = () => void;

export type SubscribeOptions = {
	recursive?: boolean;
};

export type ObservableOptions = {
	recursive?: boolean;
};

export type RecursiveKey<T> =
	T extends readonly (infer U)[] ? `${number}` | `${number}.${RecursiveKey<U>}` :
	T extends (...args: any[]) => any ? never :
	T extends object ? {
		[K in keyof T & string]: K | (T[K] extends object ? `${K}.${RecursiveKey<T[K]>}` : never);
	}[keyof T & string] :
	never;

export type PathValue<T, K extends string> =
	K extends `${infer Head}.${infer Tail}` ? (
		T extends readonly (infer U)[] ? (Head extends `${number}` ? PathValue<U, Tail> : never) :
		Head extends keyof T ? PathValue<T[Head], Tail> :
		never
	) : (
		T extends readonly (infer U)[] ? (K extends `${number}` ? U : never) :
		K extends keyof T ? T[K] :
		never
	);

type DescendantKeys<T, K extends RecursiveKey<T>> =
	K extends RecursiveKey<T> ? (
		PathValue<T, K> extends infer V ? (
			V extends object ? `${K}.${RecursiveKey<V>}` :
			never
		) :
		never
	) :
	never;

export type RecursivePath<T, K extends RecursiveKey<T>> = K | DescendantKeys<T, K>;

export type ChangeEvent<T extends object, K extends RecursiveKey<T>> = Immutable<{
	readonly newValue: DeepImmutable<PathValue<T, K>>;
	readonly oldValue: DeepImmutable<PathValue<T, K>>;
	readonly key: K;
}>;

export type RecursiveChangeEvent<T extends object, K extends RecursiveKey<T>> = ChangeEvent<T, RecursivePath<T, K> & RecursiveKey<T>>;
export type Subscriber<T extends object, K extends RecursiveKey<T>> = (e: ChangeEvent<T, K>) => void;
export type RecursiveSubscriber<T extends object, K extends RecursiveKey<T>> = (e: RecursiveChangeEvent<T, K>) => void;
export type Interceptor<T extends object, K extends RecursiveKey<T>> = (e: ChangeEvent<T, K>) => boolean | void;
export type RecursiveInterceptor<T extends object, K extends RecursiveKey<T>> = (e: RecursiveChangeEvent<T, K>) => boolean | void;

type SubscriberEvent<This extends object, K extends string, O> =
	O extends { recursive: true } ?
	RecursiveChangeEvent<This, K & RecursiveKey<This>> :
	ChangeEvent<This, K & RecursiveKey<This>>;

export type SubscriberMethod<This extends object, K extends string, O> = (this: This, event: SubscriberEvent<This, K, O>) => void;

export type SubscribeDecoratorReturn<K extends string, O> = <This extends object>(
	value: SubscriberMethod<This, K, O>,
	context: ClassMethodDecoratorContext<This>
) => void;

export interface SubscriberDecorator {
	<K extends string, O extends SubscribeOptions | undefined = undefined>(key: K, options?: O): SubscribeDecoratorReturn<K, O>;
}

type InterceptorMethod<This extends object, K extends string, O> = (this: This, event: SubscriberEvent<This, K, O>) => boolean | void;

type InterceptDecoratorReturn<K extends string, O> = <This extends object>(value: InterceptorMethod<This, K, O>, context: ClassMethodDecoratorContext<This>) => void;

export interface InterceptorDecorator {
	<K extends string, O extends SubscribeOptions | undefined = undefined>(key: K, options?: O): InterceptDecoratorReturn<K, O>;
}

export interface SubscribeFn {
	<T extends object, K extends RecursiveKey<T>>(obj: T, key: K, subscriber: Subscriber<T, K>): Unsubscriber;
	<T extends object, K extends RecursiveKey<T>>(obj: T, key: K, options: SubscribeOptions & { recursive: true }, subscriber: RecursiveSubscriber<T, K>): Unsubscriber;
}

export interface InterceptFn {
	<T extends object, K extends RecursiveKey<T>>(obj: T, key: K, interceptor: Interceptor<T, K>): Unsubscriber;
	<T extends object, K extends RecursiveKey<T>>(obj: T, key: K, options: SubscribeOptions & { recursive: true }, interceptor: RecursiveInterceptor<T, K>): Unsubscriber;
	<K extends string, O extends SubscribeOptions | undefined = undefined>(key: K, options?: O): InterceptorDecorator;
}

export type ComputedOptions = {
	eager?: boolean;
};
import { assert } from "./assert";

const TAG = Symbol("TAG");
const ENUM = Symbol("ENUM");

const tagged = <T extends {} | Function, Tag extends string>(obj: T, tag: Tag) => Object.assign(obj, { [TAG]: tag });

export type Tagged<Tag extends string, T, Enum extends TaggedEnum<any>> = T & {
	readonly [TAG]: Tag;
	readonly [ENUM]: Enum;
};

export type EnumInit<Args extends any[], R> = ((...args: Args) => R) | (new (...args: Args) => R);

export const taggedEnum = <T extends Record<string, EnumInit<any, any>>>(tags: T) => {
	const obj: Record<string, Tagged<any, any, any>> = {};
	for (const k in tags) {
		const init = tags[k]!;

		obj[k] = isConstructor(init)
			? (...args: any[]) => tagged(Reflect.construct(init, args), k)
			: (...args: any[]) => tagged(init(...args), k);
	}
	return Object.freeze(obj) as TaggedEnum<T>;
};

export type TaggedEnum<T extends Record<string, EnumInit<any, any>>> = {
	readonly [K in keyof T]: K extends string ? (
		T[K] extends new (...args: infer Args) => infer R ? (...args: Args) => Tagged<K, R, TaggedEnum<T>> :
		T[K] extends (...args: infer Args) => infer R ? (...args: Args) => Tagged<K, R, TaggedEnum<T>> :
		never
	) : never;
}

type Parse<T> =
	T extends String ? string :
	T extends Number ? number :
	T extends Boolean ? boolean :
	T extends BigInt ? bigint :
	T;

type EnumValue<T> =
	T extends (new (...args: any[]) => infer R) | ((...args: any[]) => infer R) ? (
		R extends Tagged<any, infer U, any> ? Parse<U> : never
	) : never;

export type InferEnum<T extends TaggedEnum<any>> =
	T[keyof T] extends (...args: any[]) => any ? ReturnType<T[keyof T]> :
	T[keyof T] extends new (...args: any[]) => any ? InstanceType<T[keyof T]> :
	never;

const handler = { construct() { return handler } };

const isConstructor = <Args extends any[], R>(fn: EnumInit<Args, R>): fn is (new (...args: Args) => R) => {
	if (typeof fn !== "function") return false;

	try {
		Reflect.construct(Object, [], fn);
		return true;
	} catch {
		return false;
	}
};

export const match = <Tag extends string, T, Enum extends TaggedEnum<any>, R>(obj: Tagged<Tag, T, Enum>, matcher: Matcher<Enum, R>): R => {
	const tag = obj[TAG];
	const arm = matcher[tag];
	if (!arm)
		return assert.notNull(matcher._)(void(0) as any);
	return arm(obj as any);

};

type M<T extends TaggedEnum<any>, R> = {
	readonly [K in keyof T]?: (value: EnumValue<T[K]>) => R;
};

type PartialMatcher<T extends TaggedEnum<any>, R> = M<T, R> & {
	readonly _: () => R;
};

type Matcher<T extends TaggedEnum<any>, R> = PartialMatcher<T, R> | FullMatcher<T, R>;

export type FullMatcher<T extends TaggedEnum<any>, R> = {
	[K in keyof T]: (value: EnumValue<T[K]>) => R;
};
const ENUM_TYPE = Symbol("TAGGED_ENUM_TYPE");

export const createEnum = <const T extends readonly string[]>(...types: T): Enum<T> => {
	const obj: Record<string, string> = {};
	types.forEach(type => obj[type] = Object.assign(type, { [ENUM_TYPE]: obj }));
	return obj as Enum<T>;
};

export const isVariant = <T extends Enum<any>>(type: T, value: any): value is EnumType<T> => {
	return typeof value === "string" && value in type && type[value as keyof T] === value;
};

export type EnumType<T extends Enum<any>> = T extends Enum<infer U> ? U[number] & {
	readonly [ENUM_TYPE]: Enum<U>;
} : never;

export type Enum<T extends readonly string[]> = {
	readonly [K in T[number]]: K & {
		readonly [ENUM_TYPE]: Enum<T>;
	};
};

const TAGGED_ENUM_TYPE = Symbol("TAGGED_ENUM_TYPE");
const TAGGED_ENUM_TAG = Symbol("TAGGED_ENUM_TAG");

export const createTaggedEnum = <const T extends Tags>(types: T): TaggedEnum<T> => {
	const obj: Record<string, any> = {};
	for (const k in types) {
		const val = types[k]!;
		obj[k] = (...args: any[]) => Object.assign(val(...args), { [TAGGED_ENUM_TYPE]: obj, [TAGGED_ENUM_TAG]: k });
	}
	return obj as TaggedEnum<T>;
};

type Tags = Record<string, (...args: any) => any>;
interface VariantConstructor<T extends Tags, K extends keyof T, V extends (...args: any[]) => any = T[K]> {
	(...args: Parameters<V>): TaggedEnumValue<ReturnType<V>, T, K>;
}

type TaggedEnumValue<Type, T extends Tags, Key extends keyof T> = Type & {
	readonly [TAGGED_ENUM_TYPE]: TaggedEnum<T>;
	readonly [TAGGED_ENUM_TAG]: Key;
}

export type TaggedEnum<T extends Tags> = {
	readonly [K in keyof T]: VariantConstructor<T, K>
};

export type TaggedEnumType<T extends TaggedEnum<any>> = ReturnType<T[keyof T]>;

export const isTaggedVariant = <T extends TaggedEnum<any>, K extends NoInfer<keyof T>>(value: PartialTaggedVariant<T>, variant: K): value is Extract<TaggedEnumType<T>, { readonly [TAGGED_ENUM_TAG]: K }> => {
	return value[TAGGED_ENUM_TAG] === variant;
};

type PartialTaggedVariant<T> = { readonly [TAGGED_ENUM_TYPE]: T; readonly [TAGGED_ENUM_TAG]: keyof T };

type EnumMatchArms<R, T extends Enum<any>> = {
	readonly [K in keyof T]: (value: T[K]) => R;
} | ({
	readonly [K in keyof T]?: (value: T[K]) => R;
} & {
	_: () => R;
});

type TaggedEnumMatchArms<R, T extends TaggedEnum<any>> = {
	readonly [K in keyof T]: (value: Extract<TaggedEnumType<T>, { readonly [TAGGED_ENUM_TAG]: K }>) => R;
} | ({
	readonly [K in keyof T]?: (value: Extract<TaggedEnumType<T>, { readonly [TAGGED_ENUM_TAG]: K }>) => R;
} & {
	_: () => R;
});

export function matchEnum<T extends Enum<any>, R>(enumValue: EnumType<T>, arms: EnumMatchArms<R, T>): R;
export function matchEnum<T extends TaggedEnum<any>, R>(enumValue: TaggedEnumType<T>, arms: TaggedEnumMatchArms<R, T>): R;
export function matchEnum(enumValue: any, arms: any): any {
	const tag = typeof enumValue === "object" ? enumValue[TAGGED_ENUM_TAG] : enumValue;
	const handler = arms[tag] ?? arms._;
	return handler(typeof enumValue === "object" ? enumValue : enumValue);
}

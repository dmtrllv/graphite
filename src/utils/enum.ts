export const createEnum = <const T extends readonly string[]>(...types: T): Enum<T> => {
	const obj: Record<string, string> = {};
	types.forEach(type => obj[type] = type);
	return obj as Enum<T>;
};

export const isEnumKind =  <T extends Enum<any>>(type: T, value: string): value is EnumType<T> => value in type;

export type EnumType<T extends Enum<any>> = T extends Enum<infer U> ? U[number] : never;

export type Enum<T extends readonly string[]> = {
	readonly [K in T[number]]: K;
};
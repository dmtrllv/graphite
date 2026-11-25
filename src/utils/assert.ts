const assertFn = (expr: () => boolean, error: string = `Assertion failed`): void => {
	if (!expr())
		throw new Error(error);
};

const notNull = <T>(val: T, msg: string = `Value is null!`): NonNullable<T> => {
	assertFn(() => val !== null && val !== undefined, msg);
	return val as NonNullable<T>;
};

const asyncAssert = async (expr: () => Promise<boolean>, error: string = `Assertion failed`): Promise<void> => {
	if (!await expr())
		throw new Error(error);
};

const asyncNotNull = async <T>(val: Promise<T>, msg: string = `Value is null!`): Promise<NonNullable<T>> => {
	const v = await val;
	assertFn(() => v !== null && v !== undefined, msg);
	return val as Promise<NonNullable<T>>;
};

export const assert = Object.assign(assertFn, {
	notNull,
	async: Object.assign(asyncAssert, {
		notNull: asyncNotNull
	}),
});
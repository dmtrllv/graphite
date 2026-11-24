const assertFn = (expr: () => boolean, error: string): void => {
	if(!expr())
		throw new Error(error);
};

export const assert = Object.assign(assertFn, {
	notNull: <T>(val: T, msg: string = `Value is null!`): NonNullable<T> => {
		assertFn(() => val !== null && val !== undefined, msg);
		return val as NonNullable<T>;
	},
});
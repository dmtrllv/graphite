const assertFn = (expr: () => boolean, error: string): void => {
	if(!expr())
		throw new Error(error);
};

export const assert = Object.assign(assertFn, {
	notNull: <T>(val: T): NonNullable<T> => {
		assertFn(() => val !== null && val !== undefined, `Value is null!`);
		return val as NonNullable<T>;
	},
});
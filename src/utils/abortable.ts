export const ABORT_TOKEN = Symbol();

export type Abortable<T extends {}> = T | AbortedToken;

export type AbortedToken = {
	readonly [ABORT_TOKEN]: typeof ABORT_TOKEN;
};

export const aborted = <T extends {}>(): Abortable<T> => ({ [ABORT_TOKEN]: ABORT_TOKEN });

export const isAborted = <T extends {}>(obj: Abortable<T>): obj is AbortedToken => ABORT_TOKEN in obj;
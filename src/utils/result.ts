export class Result<T, E> {
	public constructor(obj: OkResult<T> | ErrResult<E>) {
		Object.assign(this, obj);
	}

	public isOk(): this is OkResult<T> {
		return "data" in this;
	}
	
	public isErr(): this is ErrResult<E> {
		return "error" in this;
	}
}

export const Ok = <T, E>(data: T): Result<T,E> => new Result({ data });
export const Err = <T, E>(error: E): Result<T,E> => new Result({ error });

type OkResult<T> = {
	readonly data: T
};

type ErrResult<T> = {
	readonly error: T;
};
import type { MatrixType } from "./matrix";
import type { ValueType } from "./value";
import type { VectorType } from "./vector";

export type PassBuffer = {
	readonly name: "pass-buffer";
	readonly type: PassBufferType;
};

export type PassBufferType = ValueType | VectorType | MatrixType;

export const createPassBuffer = (type: PassBufferType): PassBuffer => {
	return {
		name: "pass-buffer",
		type
	};
};
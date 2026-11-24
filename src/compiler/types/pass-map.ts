import type { MatrixType } from "./matrix";
import type { ValueType } from "./value";
import type { VectorType } from "./vector";

export type PassBuffer = {
	readonly name: "pass-buffer";
	readonly type: ValueType | VectorType | MatrixType;
};

export const createPassBuffer = (type: ValueType | VectorType | MatrixType): PassBuffer => {
	return {
		name: "pass-buffer",
		type
	};
};

export type PassMap = {
	readonly name: "pass-map";
	readonly buffers: Record<string, PassBuffer>;
}

export const createPassMap = (buffers: Record<string, PassBuffer> = {}): PassMap => {
	return {
		name: "pass-map",
		buffers: buffers
	};
};
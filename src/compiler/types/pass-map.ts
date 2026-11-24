import type { MatrixType } from "./matrix";
import type { ValueType } from "./value";
import type { VectorType } from "./vector";

export type PassBufferType = ValueType | VectorType | MatrixType;

export type PassMap = {
	readonly name: "pass-map";
	readonly buffers: Record<string, PassBufferType>;
}
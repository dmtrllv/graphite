import type { MatrixType } from "./matrix";
import type { PassBuffer, PassBufferRef } from "./pass-buffer";
import type { Texture } from "./texture";
import type { ValueType } from "./value";
import type { VectorType } from "./vector";

export type Type =
	| PrimitiveType
	| PassBuffer
	| PassBufferRef
	| Texture;

export type PrimitiveType =
	| ValueType
	| VectorType
	| MatrixType;

export type ToJsType<T extends Type> =
	T extends ValueType ? number :
	T extends VectorType ? number :
	T extends MatrixType ? number :
	never;
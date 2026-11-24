import type { MatrixType } from "./matrix";
import type { PassBuffer } from "./pass-buffer";
import type { Texture } from "./texture";
import type { ValueType } from "./value";
import type { VectorType } from "./vector";

export type Type =
	| ValueType
	| VectorType
	| MatrixType
	| PassBuffer
	| Texture;

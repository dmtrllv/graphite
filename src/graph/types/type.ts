export abstract class Type {
	public readonly kind: TypeKind;

	public constructor(kind: TypeKind) {
		this.kind = kind;
	}
}

export type TypeKind = "scalar" | "vector" | "matrix";
import { Serializable, serializable } from "../../serializable";

export abstract class Type extends Serializable {
	@serializable(String)
	public readonly kind: TypeKind;

	public constructor(kind: TypeKind) {
		super();
		this.kind = kind;
	}
}

export type TypeKind = "scalar" | "vector" | "matrix";

export type TypeCtor<T extends Type> = abstract new (...args: any[]) => T;
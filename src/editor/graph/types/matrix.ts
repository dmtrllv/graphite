import type { Scalar } from "./scalar";
import { Type, type TypeCtor } from "./type";

export class Matrix extends Type {
	readonly type: TypeCtor<Scalar>;
	readonly rows: number;
	readonly columns: number;

	public constructor(type: TypeCtor<Scalar>, rows: number, columns: number) {
		super("matrix");
		this.type = type;
		this.rows = rows;
		this.columns = columns;
	}
}

export type MatrixType = typeof Matrix;
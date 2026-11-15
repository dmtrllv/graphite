import type { Scalar } from "./scalar";
import { Type } from "./type";

export class Matrix extends Type {
	readonly type: Scalar;
	readonly rows: number;
	readonly columns: number;

	public constructor(type: Scalar, rows: number, columns: number) {
		super("matrix");
		this.type = type;
		this.rows = rows;
		this.columns = columns;
	}
}

export type MatrixType = typeof Matrix;
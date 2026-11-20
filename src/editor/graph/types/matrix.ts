import { serializable } from "../../serializable";
import { F16, F32, U32, I32, Bool, type Scalar } from "./scalar";
import { Type, type TypeCtor } from "./type";

const scalarTypes: Record<string, TypeCtor<Scalar<number | boolean>>> = {
	F16,
	F32,
	U32,
	I32,
	Bool
};

@serializable({ type: "type:matrix", create: data => new Matrix(scalarTypes[data.scalar]!, data.rows, data.columns) })
export class Matrix extends Type {
	@serializable(String)
	public accessor scalar: string;

	@serializable(Number)
	public readonly rows: number;

	@serializable(Number)
	public readonly columns: number;

	public get type(): TypeCtor<Scalar> {
		return scalarTypes[this.scalar] as TypeCtor<Scalar>;
	}

	public constructor(type: TypeCtor<Scalar>, rows: number, columns: number) {
		super("matrix");
		this.scalar = type.name;
		this.rows = rows;
		this.columns = columns;
	}
}

export type MatrixType = typeof Matrix;
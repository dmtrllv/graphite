import { observable } from "../../reactive";
import { Type } from "./type";

export abstract class Scalar<T extends boolean | number = number> extends Type {
	@observable
	public accessor value: T;

	public constructor(value: T) {
		super("scalar");
		this.value = value;
	}
}

export class F16 extends Scalar { }
export class F32 extends Scalar { }
export class U32 extends Scalar { }
export class I32 extends Scalar { }
export class Bool extends Scalar<boolean> { }

export type BoolType = typeof Bool;
export type NumericTypes = (typeof NumericTypes)[number];

export type PrimitiveType = NumericTypes | BoolType;

export const NumericTypes = [F16, F32, U32, I32] as const;

export const isScalar = (type: Type | readonly Type[]) => {
	if (Array.isArray(type))
		return !!type.find(NumericTypes.includes);
	return NumericTypes.includes(type as any);
};
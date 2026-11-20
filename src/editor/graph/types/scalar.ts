import { observable } from "@reactive";
import { serializable } from "../../serializable";
import { Type } from "./type";

export abstract class Scalar<T = number | boolean> extends Type {
	public abstract accessor value: T;
}

export abstract class NumberScalar extends Scalar<number> {
	@observable
	@serializable(Number)
	public accessor value: number;

	public constructor(value: number) {
		super("scalar");
		this.value = value;
	}
}

@serializable({ type: "type:f16", create: () => new F16(0) })
export class F16 extends NumberScalar { }

@serializable({ type: "type:f32", create: () => new F32(0) })
export class F32 extends NumberScalar { }

@serializable({ type: "type:u32", create: () => new U32(0) })
export class U32 extends NumberScalar { }

@serializable({ type: "type:i32", create: () => new I32(0) })
export class I32 extends NumberScalar { }

@serializable({ type: "type:bool", create: () => new Bool(false) })
export class Bool extends Scalar<Boolean> {
	@observable
	@serializable(Boolean)
	public accessor value: boolean;

	public constructor(value: boolean) {
		super("scalar");
		this.value = value;
	}
}

export type BoolType = typeof Bool;

export type NumericTypes = (typeof NumericTypes)[number];

export type PrimitiveType = NumericTypes | BoolType;

export const NumericTypes = [F16, F32, U32, I32] as const;
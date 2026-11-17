import { NumericTypes, Scalar } from "./scalar";
import { Type, type TypeCtor } from "./type";
import { Vec2, Vec3, Vec4 } from "./vec";

export type TypeConversion =
	| { kind: "identity" }
	| { kind: "vector-extend"; from: number; to: number }
	| { kind: "vector-truncate"; from: number; to: number };

const vectorDimensions = new Map<TypeCtor<Type>, number>([
	[Vec2, 2],
	[Vec3, 3],
	[Vec4, 4]
]);

const getVectorDimension = (type: Type): number | undefined => {
	return vectorDimensions.get(type.constructor as TypeCtor<Type>);
};

const isNumericScalar = (type: Type): boolean => {
	return NumericTypes.some(ctor => type instanceof ctor);
};

export const getTypeConversion = (source: Type, target: Type): TypeConversion | null => {
	if (source.constructor === target.constructor)
		return { kind: "identity" };

	if (source instanceof Scalar && target instanceof Scalar)
		return null;

	const sourceDimension = source instanceof Scalar && isNumericScalar(source) ? 1 : getVectorDimension(source);

	const targetDimension = getVectorDimension(target);

	if (sourceDimension === undefined || targetDimension === undefined)
		return null;

	if (source instanceof Scalar && !isNumericScalar(source))
		return null;

	if (sourceDimension < targetDimension)
		return {
			kind: "vector-extend",
			from: sourceDimension,
			to: targetDimension
		};

	if (sourceDimension > targetDimension)
		return {
			kind: "vector-truncate",
			from: sourceDimension,
			to: targetDimension
		};

	return null;
};

export const emitTypeConversion = (source: Type, target: Type, expression: string): string => {
	const conversion = getTypeConversion(source, target);

	if (!conversion)
		throw new Error(`Cannot convert ${source.constructor.name} to ${target.constructor.name}!`);

	switch (conversion.kind) {
		case "identity":
			return expression;

		case "vector-extend": {
			const value = source instanceof Scalar ? `f32(${expression})` : expression;
			const zeros = Array.from({ length: conversion.to - conversion.from }, () => "0.0");
			return `vec${conversion.to}<f32>(${[value, ...zeros].join(", ")})`;
		}

		case "vector-truncate":
			return `${expression}.${["", "x", "xy", "xyz"][conversion.to]}`;
	}
};
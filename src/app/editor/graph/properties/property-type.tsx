import { Bool, F16, F32, I32, U32, Vec2, Vec3, Vec4, type Type } from "@editor";
import React from "react";
import { NodePropInputs } from "../renderer/node-prop-view";

const types = {
	F16,
	F32,
	U32,
	I32,
	Bool,
	Vec2,
	Vec3,
	Vec4
};

const createType = (name: keyof typeof types): Type => {
	switch (name) {
		case "F16": return new F16(0);
		case "F32": return new F32(0);
		case "U32": return new U32(0);
		case "I32": return new I32(0);
		case "Bool": return new Bool(false);
		case "Vec2": return new Vec2();
		case "Vec3": return new Vec3();
		case "Vec4": return new Vec4();
	}
};

const getTypeName = (type: Type): keyof typeof types => type.constructor.name as keyof typeof types;

type GraphPropertyTypeProps = {
	type: Type;
	onChange: (type: Type) => void;
};

export const GraphPropertyType = ({ type, onChange }: GraphPropertyTypeProps) => {
	const Input: React.FC<any> = NodePropInputs.get(type.constructor as any) || (() => <div className="spacing" />);

	return (
		<>
			<select value={getTypeName(type)} onChange={event => onChange(createType(event.target.value as keyof typeof types))}>
				{Object.keys(types).map(type => <option key={type} value={type}>{type}</option>)}
			</select>
			<Input value={type} />
		</>
	);
};
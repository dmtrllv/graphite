import type { Type } from "./type";

export const getWGSLType = (type: Type): string => {
	switch (type.name) {
		case "value": return "f32";
		case "vector": return `vec${type.size}<f32>`;
		case "matrix": return `mat${type.columns}x${type.rows}<f32>`;
	}
};
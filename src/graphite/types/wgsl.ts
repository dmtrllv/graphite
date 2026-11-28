import type { Type } from "./type";

export const getWGSLType = (type: Type): string => {
	switch (type.name) {
		case "f32": return "f32";
		case "vec2": return `vec2f`;
		case "vec3": return `vec3f`;
		case "vec4": return `vec4f`;
		case "matrix": return `mat${type.columns}x${type.rows}<f32>`;
		default: throw new Error(`Unsupported WGSL type: ${type.name}!`);
	}
};
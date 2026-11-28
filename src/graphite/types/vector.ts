export type VectorType<N extends 2 | 3 | 4 = 2 | 3 | 4> = {
	readonly name: `vec${N}`;
	readonly size: N;
};

export const Vec2: VectorType<2> = {
	name: "vec2",
	size: 2,
};

export const Vec3: VectorType<3> = {
	name: "vec3",
	size: 3,
};

export const Vec4: VectorType<4> = {
	name: "vec4",
	size: 4,
};

export const Color: VectorType<4> = {
	name: "vec4",
	size: 4,
};

export abstract class Vector {}

export class Vector2 extends Vector {}
export class Vector3 extends Vector {}
export class Vector4 extends Vector {}
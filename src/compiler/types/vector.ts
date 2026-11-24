export type VectorType<N extends 2 | 3 | 4 = 2 | 3 | 4> = {
	readonly name: "vector";
	readonly size: N;
};

export const Vec2: VectorType<2> = {
	name: "vector",
	size: 2,
};

export const Vec3: VectorType<3> = {
	name: "vector",
	size: 3,
};

export const Vec4: VectorType<4> = {
	name: "vector",
	size: 4,
};
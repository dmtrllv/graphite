import { observable } from "../../reactive";
import { Type } from "./type";

export class Vec2 extends Type {
	@observable
	public accessor x: number;

	@observable
	public accessor y: number;

	public constructor(x: number = 0, y: number = 0) {
		super("vector");
		this.x = x;
		this.y = y;
	}
}

export type Vec2Type = typeof Vec2;

export class Vec3 extends Type {
	@observable
	public accessor x: number;
	@observable
	public accessor y: number;
	@observable
	public accessor z: number;

	public constructor(x: number = 0, y: number = 0, z: number = 0) {
		super("vector");
		this.x = x;
		this.y = y;
		this.z = z;
	}
}

export type Vec3Type = typeof Vec3;

export class Vec4 extends Type {
	@observable
	public accessor x: number;
	@observable
	public accessor y: number;
	@observable
	public accessor z: number;
	@observable
	public accessor w: number;

	public constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
		super("vector");
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}
}

export type Vec4Type = typeof Vec4;

export const VectorTypes = [Vec2, Vec3, Vec4] as const;
export type VectorTypes = (typeof VectorTypes)[number];

export type Vector = Vec2 | Vec3 | Vec4;
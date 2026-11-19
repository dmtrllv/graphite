import { observable } from "@reactive";
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

	public clone() {
		return new Vec2(this.x, this.y)
	}

	public add({ x, y }: Vec2) {
		this.x += x;
		this.y += y;
		return this;
	}

	public sub({ x, y }: Vec2) {
		this.x -= x;
		this.y -= y;
		return this;
	}

	public mul(scalar: number): this;
	public mul({ x, y }: Vec2): this;
	public mul(scalar: Vec2 | number) {
		if (typeof scalar === "number") {
			this.x *= scalar;
			this.y *= scalar;
		} else {
			this.x *= scalar.x;
			this.y *= scalar.y;
		}
		return this;
	}

	public set({ x, y }: Partial<Vec2>) {
		if (x !== undefined)
			this.x = x;
		if (y !== undefined)
			this.y = y;
	}

	public distance({ x, y }: Vec2) {
		return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2))
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

	public clone() {
		return new Vec3(this.x, this.y, this.z);
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

	public clone() {
		return new Vec4(this.x, this.y, this.z, this.w);
	}
}

export type Vec4Type = typeof Vec4;

export const VectorTypes = [Vec2, Vec3, Vec4] as const;
export type VectorTypes = (typeof VectorTypes)[number];

export type Vector = Vec2 | Vec3 | Vec4;
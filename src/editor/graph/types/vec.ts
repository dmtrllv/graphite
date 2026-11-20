import { observable } from "@reactive";
import { serializable } from "../../serializable";
import { Type } from "./type";

export abstract class Vector extends Type { }

@observable
@serializable({ type: "type:vec2", create: () => new Vec2() })
export class Vec2 extends Vector {
	@observable
	@serializable(Number)
	public accessor x: number;

	@observable
	@serializable(Number)
	public accessor y: number;

	public constructor(x: number = 0, y: number = 0) {
		super("vector");
		this.x = x;
		this.y = y;
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

@observable
@serializable({ type: "type:vec3", create: () => new Vec3() })
export class Vec3 extends Vector {
	@observable
	@serializable(Number)
	public accessor x: number;
	@observable
	@serializable(Number)
	public accessor y: number;
	@observable
	@serializable(Number)
	public accessor z: number;

	public constructor(x: number = 0, y: number = 0, z: number = 0) {
		super("vector");
		this.x = x;
		this.y = y;
		this.z = z;
	}
}

export type Vec3Type = typeof Vec3;

@observable
@serializable({ type: "type:vec4", create: () => new Vec4() })
export class Vec4 extends Vector {
	@observable
	@serializable(Number)
	public accessor x: number;
	@observable
	@serializable(Number)
	public accessor y: number;
	@observable
	@serializable(Number)
	public accessor z: number;
	@observable
	@serializable(Number)
	public accessor w: number;

	public constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
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
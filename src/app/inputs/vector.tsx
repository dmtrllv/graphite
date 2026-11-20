import type { Vec2, Vec3, Vec4, Vector } from "../../editor";

import "./styles/vector.scss";

export const Vec2Input = ({ name, value, disabled }: VecProps<Vec2>) => (
	<div className="vec2">
		{name && <label>{name}</label>}
		<input type="number" value={disabled ? "" : value.x} placeholder="x" disabled={disabled} onChange={e => value.x = +e.target.value} />
		<input type="number" value={disabled ? "" : value.y} placeholder="y" disabled={disabled} onChange={e => value.y = +e.target.value} />
	</div>
);

export const Vec3Input = ({ name, value, disabled }: VecProps<Vec3>) => (
	<div className="vec3">
		{name && <label>{name}</label>}
		<input type="number" value={disabled ? "" : value.x} placeholder="x" disabled={disabled} onChange={e => value.x = +e.target.value} />
		<input type="number" value={disabled ? "" : value.y} placeholder="y" disabled={disabled} onChange={e => value.y = +e.target.value} />
		<input type="number" value={disabled ? "" : value.z} placeholder="z" disabled={disabled} onChange={e => value.z = +e.target.value} />
	</div>
);

export const Vec4Input = ({ name, value, disabled }: VecProps<Vec4>) => (
	<div className="vec4">
		{name && <label>{name}</label>}
		<input type="number" value={disabled ? "" : value.x} placeholder="x" disabled={disabled} onChange={e => value.x = +e.target.value} />
		<input type="number" value={disabled ? "" : value.y} placeholder="y" disabled={disabled} onChange={e => value.y = +e.target.value} />
		<input type="number" value={disabled ? "" : value.z} placeholder="z" disabled={disabled} onChange={e => value.z = +e.target.value} />
		<input type="number" value={disabled ? "" : value.w} placeholder="w" disabled={disabled} onChange={e => value.w = +e.target.value} />
	</div>
);

export type VecProps<T extends Vector> = {
	readonly disabled?: boolean;
	readonly name: string;
	readonly value: T;
}
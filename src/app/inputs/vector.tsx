import type { Vec2, Vec3, Vec4, Vector } from "../../editor";

import "./styles/vector.scss";

export const Vec2Input = ({ name, value, disabled }: VecProps<Vec2>) => (
	<div className={`vec2 ${disabled ? "disabled" : ""}`}>
		{name && <label>{name}</label>}
		<div>
			<label className="x">x</label>
			<input type="number" value={disabled ? "" : value.x} placeholder={disabled ? undefined : "x"} disabled={disabled} onChange={e => value.x = +e.target.value} />
		</div>
		<div>
			<label className="y">y</label>
			<input type="number" value={disabled ? "" : value.y} placeholder={disabled ? undefined : "y"} disabled={disabled} onChange={e => value.y = +e.target.value} />
		</div>
	</div>
);

export const Vec3Input = ({ name, value, disabled }: VecProps<Vec3>) => (
	<div className={`vec3 ${disabled ? "disabled" : ""}`}>
		{name && <label>{name}</label>}
		<div>
			<label className="x">x</label>
			<input type="number" value={disabled ? "" : value.x} placeholder={disabled ? undefined : "x"} disabled={disabled} onChange={e => value.x = +e.target.value} />
		</div>
		<div>
			<label className="y">y</label>
			<input type="number" value={disabled ? "" : value.y} placeholder={disabled ? undefined : "y"} disabled={disabled} onChange={e => value.y = +e.target.value} />
		</div>
		<div>
			<label className="z">z</label>
			<input type="number" value={disabled ? "" : value.z} placeholder={disabled ? undefined : "z"} disabled={disabled} onChange={e => value.z = +e.target.value} />
		</div>
	</div>
);

export const Vec4Input = ({ name, value, disabled }: VecProps<Vec4>) => (
	<div className={`vec4 ${disabled ? "disabled" : ""}`}>
		{name && <label>{name}</label>}
		<div>
			<label className="x">x</label>
			<input type="number" value={disabled ? "" : value.x} placeholder={disabled ? undefined : "x"} disabled={disabled} onChange={e => value.x = +e.target.value} />
		</div>
		<div>
			<label className="y">y</label>
			<input type="number" value={disabled ? "" : value.y} placeholder={disabled ? undefined : "y"} disabled={disabled} onChange={e => value.y = +e.target.value} />
		</div>
		<div>
			<label className="z">z</label>
			<input type="number" value={disabled ? "" : value.z} placeholder={disabled ? undefined : "z"} disabled={disabled} onChange={e => value.z = +e.target.value} />
		</div>
		<div>
			<label className="w">w</label>
			<input type="number" value={disabled ? "" : value.w} placeholder={disabled ? undefined : "w"} disabled={disabled} onChange={e => value.w = +e.target.value} />
		</div>
	</div>
);

export type VecProps<T extends Vector> = {
	readonly disabled?: boolean;
	readonly name: string;
	readonly value: T;
}
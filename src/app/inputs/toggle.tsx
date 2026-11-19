import { useEffect, useState } from "react";

import "./styles/toggle.scss";

export const Toggle = ({ className, id, label, value, onChange, disabled }: ToggleProps) => {
	const [val, setValue] = useState(value);

	const toggle = () => {
		setValue(!val);
		onChange(!val);
	};

	useEffect(() => {
		if (value !== val)
			setValue(val);
	}, [value]);

	return (
		<div className={`toggle ${className ?? ""} ${val ? "active" : ""} ${disabled ? "disabled" : ""}`} id={id} onClick={toggle}>
			{label && <label>{label}</label>}
			<div />
		</div>
	);
};

export type ToggleProps = {
	disabled?: boolean;
	id?: string;
	className?: string;
	label?: string;
	value: boolean;
	onChange: (value: boolean) => any;
}
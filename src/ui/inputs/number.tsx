import { useEffect, useState } from "react";
import { cn } from "@utils";

import "./styles/number.scss";

export const NumberInput = ({ onChange, value, className, label, disabled }: NumberInputProps) => {
	const [val, setVal] = useState(value.toString());
	const [active, setActive] = useState(false);

	const onFocus = () => setActive(true);;

	const onBlur = () => {
		setActive(false);

		const v = Number.parseFloat(val);
		if (!Number.isNaN(v)) {
			const vs = v.toString();
			if (val !== vs) {
				setVal(vs);
				onChange && onChange(v);
			}
		} else {
			setVal("0");
			onChange && onChange(0);
		}
	};

	useEffect(() => {
		const newValue = value.toString();
		if (val !== newValue)
			setVal(newValue);
	}, [value]);

	return (
		<div className={cn("number-input", { className, active, disabled })}>
			{label && <label>{label}:</label>}
			<input value={val} onChange={e => setVal(e.target.value)} onBlur={onBlur} onFocus={onFocus} disabled={disabled} />
		</div>
	);
};

export type NumberInputProps = {
	onChange?: (value: number) => any;
	value: number;
	className?: string;
	label?: string;
	disabled?: boolean;
}
import { useState } from "react";
import { cn } from "@utils";

import "./styles/text.scss";

export const TextInput = ({ value, className, label, disabled, onChange }: TextInputProps) => {
	const [active, setActive] = useState(false);

	const onFocus = () => setActive(true);
	const onBlur = () => setActive(false);

	return (
		<div className={cn("text-input", { className, active, disabled })}>
			{label && <label>{label}:</label>}
			<input value={value} onChange={e => onChange && onChange(e.target.value)} onBlur={onBlur} onFocus={onFocus} disabled={disabled} />
		</div>
	);
};

export type TextInputProps = {
	onChange?: (value: string) => any;
	value: string;
	className?: string;
	label?: string;
	disabled?: boolean;
}
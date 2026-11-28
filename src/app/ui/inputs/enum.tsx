import { cn, mapChildren, type Enum, type EnumType } from "@utils";

export const EnumInput = <T extends Enum<any>>({ type, onChange, value, className, disabled, label }: EnumInputProps<T>) => {
	return (
		<div className={cn("enum-input", {}, className)}>
			{label && <label>{label}</label>}
			<select className={className} disabled={disabled} value={value} onChange={e => onChange && onChange(e.target.value as EnumType<T>)}>
				{mapChildren(type, op => <option value={op}>{op}</option>)}
			</select>
		</div>
	);
}

export type EnumInputProps<T extends Enum<any>> = {
	type: T;
	value: EnumType<T>;
	onChange?: (value: EnumType<T>) => any;
	className?: string;
	label?: string;
	disabled?: boolean;
}